import { auth } from "@/auth"
import { NextResponse } from "next/server"
import fs, { writeFile } from "fs/promises"
import { createReadStream } from "fs"
import path from "path"
import { Stats } from "fs"
import { getUserById } from "@/lib/users"

const STORAGE_ROOT = path.resolve(process.cwd(), "files-storage")

// Helper to ensure basic directories exist
async function ensureBaseDirs() {
    try {
        await fs.mkdir(STORAGE_ROOT, { recursive: true })
        await fs.mkdir(path.join(STORAGE_ROOT, "public"), { recursive: true })
        await fs.mkdir(path.join(STORAGE_ROOT, "shared"), { recursive: true })
        await fs.mkdir(path.join(STORAGE_ROOT, "users"), { recursive: true })
    } catch (e) {
        console.error("Error ensuring base directories:", e)
    }
}

// Helper to check if user has access to a path
async function checkUserAccess(userId: string, requestedPath: string): Promise<boolean> {
    const user = await getUserById(userId)
    if (!user) return false

    // Admins have access to everything
    // Including absolute paths for drives
    if (user.role === 'admin') return true

    // Allow access to external drives for all users
    const { isExternal } = resolvePath(requestedPath)
    if (isExternal) return true

    // Block direct access to root for non-admin users if it's not a drive
    if (requestedPath === '/' || requestedPath === '') {
        return false
    }

    // Check if requested path is within user's allowed folders
    const normalizedPath = path.normalize(requestedPath)
    return user.folders.some(folder => {
        const normalizedFolder = path.normalize(folder.path)
        return normalizedPath.startsWith(normalizedFolder) || normalizedPath === normalizedFolder
    })
}

// Helper to determine real path (handles internal storage vs external/absolute paths)
function resolvePath(requestPath: string): { fullPath: string, isExternal: boolean } {
    // If path starts with common mount points, treat as absolute/external
    const isExternal = requestPath.startsWith('/media') ||
        requestPath.startsWith('/mnt') ||
        requestPath.startsWith('/run/media') ||
        requestPath.startsWith('/Volumes')

    if (isExternal) {
        return { fullPath: requestPath, isExternal: true }
    }

    // Otherwise, resolve relative to storage root
    return {
        fullPath: path.resolve(STORAGE_ROOT, requestPath.replace(/^\/+/, '')),
        isExternal: false
    }
}

export async function GET(req: Request) {
    await ensureBaseDirs()
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const url = new URL(req.url)
    const requestPath = url.searchParams.get("path") || "/"
    const action = url.searchParams.get("action") || "list"

    try {
        // Check user permissions
        const hasAccess = await checkUserAccess(session.user.id, requestPath)
        if (!hasAccess) {
            return new NextResponse("Access denied to this folder", { status: 403 })
        }

        const { fullPath, isExternal } = resolvePath(requestPath)

        if (!isExternal && !fullPath.startsWith(STORAGE_ROOT)) {
            return new NextResponse("Invalid path", { status: 400 })
        }

        let stats: Stats
        try {
            stats = await fs.stat(fullPath)
        } catch (e) {
            return new NextResponse("File not found", { status: 404 })
        }

        // Handle File Download / View
        if (stats.isFile()) {
            if (action === 'download' || action === 'view') {
                const fileStream = createReadStream(fullPath)
                const ext = path.extname(fullPath).toLowerCase()

                const mimeTypes: Record<string, string> = {
                    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
                    '.txt': 'text/plain', '.html': 'text/html', '.css': 'text/css',
                    '.js': 'application/javascript', '.json': 'application/json',
                    '.pdf': 'application/pdf', '.mp4': 'video/mp4'
                }
                const contentType = mimeTypes[ext] || 'application/octet-stream'

                const headers = new Headers()
                headers.set("Content-Type", contentType)
                headers.set("Content-Length", stats.size.toString())

                if (action === 'download') {
                    headers.set("Content-Disposition", `attachment; filename="${path.basename(fullPath)}"`)
                } else {
                    headers.set("Content-Disposition", `inline; filename="${path.basename(fullPath)}"`)
                }

                // @ts-ignore
                return new NextResponse(fileStream, { headers })
            }

            return NextResponse.json({
                id: requestPath,
                name: path.basename(fullPath),
                isDir: false,
                size: stats.size,
                modDate: stats.mtime.toISOString(),
                ext: path.extname(fullPath).toLowerCase()
            })
        }

        // Handle Directory Listing
        if (stats.isDirectory()) {
            const files = await fs.readdir(fullPath)
            const fileData = await Promise.all(files.map(async (file) => {
                try {
                    const filePath = path.join(fullPath, file)
                    const stats = await fs.stat(filePath)
                    const relativePath = path.join(requestPath, file)

                    return {
                        id: relativePath,
                        name: file,
                        isDir: stats.isDirectory(),
                        size: stats.size,
                        modDate: stats.mtime.toISOString(),
                        ext: path.extname(file).toLowerCase()
                    }
                } catch (e) { return null }
            }))
            return NextResponse.json(fileData.filter(Boolean))
        }

        return new NextResponse("Not a file or directory", { status: 400 })

    } catch (e: any) {
        console.error(e)
        return new NextResponse("Internal Server Error: " + e.message, { status: 500 })
    }
}

export async function POST(req: Request) {
    await ensureBaseDirs()
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const contentType = req.headers.get("content-type") || ""
        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData()
            const file = formData.get("file") as File
            const requestPath = formData.get("path") as string

            if (!file || !requestPath) return new NextResponse("Missing file or path", { status: 400 })

            // Check permissions
            const hasAccess = await checkUserAccess(session.user.id, requestPath)
            if (!hasAccess) {
                return new NextResponse("Access denied to this folder", { status: 403 })
            }

            const { fullPath: destFolder, isExternal } = resolvePath(requestPath)
            const filePath = path.join(destFolder, file.name)

            if (!isExternal && !filePath.startsWith(STORAGE_ROOT)) return new NextResponse("Invalid path", { status: 400 })

            const buffer = Buffer.from(await file.arrayBuffer())
            await writeFile(filePath, buffer)

            return NextResponse.json({ success: true })
        }

        const { action, path: requestPath, name, content, destination } = await req.json()

        // Check permissions
        const hasAccess = await checkUserAccess(session.user.id, requestPath)
        if (!hasAccess) {
            return new NextResponse("Access denied to this folder", { status: 403 })
        }

        const { fullPath, isExternal } = resolvePath(requestPath)

        if (!isExternal && !fullPath.startsWith(STORAGE_ROOT)) {
            return new NextResponse("Invalid path", { status: 400 })
        }

        switch (action) {
            case 'create_folder': {
                // Block folder creation in user's home directory (/users/{username}/)
                // Users should only create folders inside Documents, Downloads, etc.
                const userHomePattern = /^\/users\/[^\/]+$/
                if (userHomePattern.test(requestPath)) {
                    return new NextResponse(
                        "No puedes crear carpetas aquí.",
                        { status: 403 }
                    )
                }

                const newFolderPath = path.join(fullPath, name)
                if (!isExternal && !newFolderPath.startsWith(STORAGE_ROOT)) return new NextResponse("Invalid name", { status: 400 })
                await fs.mkdir(newFolderPath)
                return NextResponse.json({ success: true })
            }

            case 'read_file': {
                const content = await fs.readFile(fullPath, 'utf-8')
                return NextResponse.json({ content })
            }

            case 'write_file': {
                await fs.writeFile(fullPath, content)
                return NextResponse.json({ success: true })
            }

            case 'rename': {
                const newPath = path.join(path.dirname(fullPath), name)
                if (!isExternal && !newPath.startsWith(STORAGE_ROOT)) return new NextResponse("Invalid name", { status: 400 })
                await fs.rename(fullPath, newPath)
                return NextResponse.json({ success: true })
            }

            case 'copy': {
                const { fullPath: destPath, isExternal: isDestExternal } = resolvePath(destination)
                if (!isDestExternal && !destPath.startsWith(STORAGE_ROOT)) return new NextResponse("Invalid destination", { status: 400 })

                // Check destination permissions
                const hasDestAccess = await checkUserAccess(session.user.id, destination)
                if (!hasDestAccess) {
                    return new NextResponse("Access denied to destination folder", { status: 403 })
                }

                await fs.cp(fullPath, destPath, { recursive: true })
                return NextResponse.json({ success: true })
            }

            case 'move': {
                const { fullPath: destPath, isExternal: isDestExternal } = resolvePath(destination)
                if (!isDestExternal && !destPath.startsWith(STORAGE_ROOT)) return new NextResponse("Invalid destination", { status: 400 })

                // Check destination permissions
                const hasDestAccess = await checkUserAccess(session.user.id, destination)
                if (!hasDestAccess) {
                    return new NextResponse("Access denied to destination folder", { status: 403 })
                }

                await fs.rename(fullPath, destPath)
                return NextResponse.json({ success: true })
            }

            case 'zip': {
                const archiver = require('archiver')
                const { createWriteStream } = require('fs')

                // Determine zip file name and path
                const stats = await fs.stat(fullPath)
                const baseName = path.basename(fullPath)
                const zipName = stats.isDirectory() ? `${baseName}.zip` : `${baseName.replace(/\.[^.]+$/, '')}.zip`
                const zipPath = path.join(path.dirname(fullPath), zipName)

                return new Promise<Response>((resolve, reject) => {
                    const output = createWriteStream(zipPath)
                    const archive = archiver('zip', { zlib: { level: 9 } })

                    output.on('close', () => {
                        resolve(NextResponse.json({ success: true, file: zipName }))
                    })

                    archive.on('error', (err: any) => {
                        reject(new NextResponse(`Zip error: ${err.message}`, { status: 500 }))
                    })

                    archive.pipe(output)

                    if (stats.isDirectory()) {
                        archive.directory(fullPath, false)
                    } else {
                        archive.file(fullPath, { name: path.basename(fullPath) })
                    }

                    archive.finalize()
                })
            }

            case 'unzip': {
                const AdmZip = require('adm-zip')

                // Extract to a folder with the same name as the zip (without .zip extension)
                const extractDir = fullPath.replace(/\.zip$/i, '')

                try {
                    const zip = new AdmZip(fullPath)
                    zip.extractAllTo(extractDir, true) // true = overwrite
                    return NextResponse.json({ success: true })
                } catch (err: any) {
                    return new NextResponse(`Unzip error: ${err.message}`, { status: 500 })
                }
            }

            default:
                return new NextResponse("Invalid action", { status: 400 })
        }

    } catch (e: any) {
        console.error(e)
        return new NextResponse("Internal Server Error: " + e.message, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    await ensureBaseDirs()
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const url = new URL(req.url)
    const requestPath = url.searchParams.get("path")

    if (!requestPath) return new NextResponse("Missing path", { status: 400 })


    try {
        // Check permissions
        const hasAccess = await checkUserAccess(session.user.id, requestPath)
        if (!hasAccess) {
            return new NextResponse("Access denied to this folder", { status: 403 })
        }

        const { fullPath, isExternal } = resolvePath(requestPath)

        if (!isExternal && !fullPath.startsWith(STORAGE_ROOT)) {
            return new NextResponse("Invalid path", { status: 400 })
        }

        if (fullPath === STORAGE_ROOT || fullPath === STORAGE_ROOT + '/') {
            return new NextResponse("Cannot delete root", { status: 400 })
        }

        // Check if this folder is configured in folders.json (protected)
        // Only protect directories, not files
        let isDirectory = false
        try {
            const stats = await fs.stat(fullPath)
            isDirectory = stats.isDirectory()

            if (isDirectory) {
                // Block deletion of user's default folders (Documents, Downloads, Pictures, Music, Videos)
                const userDefaultFolderPattern = /^\/users\/[^\/]+\/(Documents|Downloads|Pictures|Music|Videos)$/
                if (userDefaultFolderPattern.test(requestPath)) {
                    return new NextResponse(
                        "No puedes eliminar esta carpeta. Es una carpeta predeterminada de tu perfil.",
                        { status: 403 }
                    )
                }

                const configPath = path.join(process.cwd(), 'config', 'folders.json')
                const configData = await fs.readFile(configPath, 'utf-8')
                const configuredFolders = JSON.parse(configData)

                // Check if this exact folder is protected
                const isDirectlyProtected = configuredFolders.some((f: any) => f.path === requestPath)

                // Check if this folder contains any protected subfolders
                const containsProtectedSubfolders = configuredFolders.some((f: any) =>
                    f.path.startsWith(requestPath + '/')
                )

                if (isDirectlyProtected) {
                    return new NextResponse(
                        "No puedes eliminar esta carpeta: está configurada en Quick Access. Elimínala desde Configuración primero.",
                        { status: 403 }
                    )
                }

                if (containsProtectedSubfolders) {
                    const protectedChildren = configuredFolders
                        .filter((f: any) => f.path.startsWith(requestPath + '/'))
                        .map((f: any) => f.path)
                        .join(', ')

                    return new NextResponse(
                        `No puedes eliminar esta carpeta: contiene carpetas de Quick Access (${protectedChildren}). Elimínalas desde Configuración primero.`,
                        { status: 403 }
                    )
                }
            }
        } catch (error) {
            // If config doesn't exist or file doesn't exist, continue with deletion
        }

        // Delete the file/folder
        await fs.rm(fullPath, { recursive: true, force: true })

        // If it was a directory, clean up any references in folders.json
        if (isDirectory) {
            try {
                const configPath = path.join(process.cwd(), 'config', 'folders.json')
                let configuredFolders = []

                try {
                    const configData = await fs.readFile(configPath, 'utf-8')
                    configuredFolders = JSON.parse(configData)
                } catch {
                    // Config doesn't exist, nothing to clean up
                    return NextResponse.json({ success: true })
                }

                // Remove the deleted folder and any subfolders from the config
                const updatedFolders = configuredFolders.filter((f: any) => {
                    // Remove if exact match or if it's a subfolder
                    return f.path !== requestPath && !f.path.startsWith(requestPath + '/')
                })

                // Save updated config if something was removed
                if (updatedFolders.length !== configuredFolders.length) {
                    await fs.writeFile(configPath, JSON.stringify(updatedFolders, null, 2))
                }
            } catch (error) {
                console.error('Failed to clean up folders.json:', error)
                // Don't fail the delete operation if cleanup fails
            }
        }

        return NextResponse.json({ success: true })

    } catch (e: any) {
        console.error(e)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
