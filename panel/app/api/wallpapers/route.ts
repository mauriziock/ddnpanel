import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { writeFile } from "fs/promises"

export const dynamic = 'force-dynamic'

const WALLPAPERS_DIR = path.join(process.cwd(), 'files-storage', 'wallpapers')
const CONFIG_DIR = path.join(process.cwd(), 'config')
const WALLPAPERS_CONFIG = path.join(CONFIG_DIR, 'wallpapers.json')

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'])

async function ensureDirectories() {
    await fs.mkdir(WALLPAPERS_DIR, { recursive: true })
    await fs.mkdir(CONFIG_DIR, { recursive: true })

    try {
        await fs.access(WALLPAPERS_CONFIG)
    } catch {
        await fs.writeFile(WALLPAPERS_CONFIG, JSON.stringify({ wallpapers: [] }))
    }
}

// GET - List wallpapers for the current user
export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })
    const userId = session.user?.id

    try {
        await ensureDirectories()
        const data = await fs.readFile(WALLPAPERS_CONFIG, 'utf-8')
        const config = JSON.parse(data)
        const userWallpapers = (config.wallpapers || []).filter((w: any) => w.userId === userId)
        return NextResponse.json(userWallpapers)
    } catch (error: any) {
        return new NextResponse("Error reading wallpapers: " + error.message, { status: 500 })
    }
}

// POST - Upload wallpaper for the current user
export async function POST(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })
    const userId = session.user?.id

    try {
        await ensureDirectories()

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) return new NextResponse("No file provided", { status: 400 })

        const extension = (file.name.split('.').pop() || '').toLowerCase()
        const isMimeOk = file.type.startsWith('image/')
        const isExtOk = ALLOWED_EXTENSIONS.has(extension)
        if (!isMimeOk && !isExtOk) {
            return new NextResponse("File must be an image", { status: 400 })
        }

        const timestamp = Date.now()
        const safeExt = isExtOk ? extension : 'jpg'
        const filename = `wallpaper_${timestamp}.${safeExt}`
        const filepath = path.join(WALLPAPERS_DIR, filename)

        const bytes = await file.arrayBuffer()
        await writeFile(filepath, new Uint8Array(bytes))

        const data = await fs.readFile(WALLPAPERS_CONFIG, 'utf-8')
        const config = JSON.parse(data)

        const newWallpaper = {
            id: timestamp.toString(),
            userId,
            url: `/api/wallpapers/file/${filename}`,
            name: file.name,
            uploadedAt: new Date().toISOString()
        }

        config.wallpapers = config.wallpapers || []
        config.wallpapers.push(newWallpaper)
        await fs.writeFile(WALLPAPERS_CONFIG, JSON.stringify(config, null, 2))

        return NextResponse.json(newWallpaper)
    } catch (error: any) {
        return new NextResponse("Error uploading wallpaper: " + error.message, { status: 500 })
    }
}

// DELETE - Remove a wallpaper (only owner can delete)
export async function DELETE(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })
    const userId = session.user?.id

    try {
        const { id } = await req.json()
        await ensureDirectories()
        const data = await fs.readFile(WALLPAPERS_CONFIG, 'utf-8')
        const config = JSON.parse(data)

        const wallpaper = config.wallpapers.find((w: any) => w.id === id)
        if (!wallpaper) return new NextResponse("Wallpaper not found", { status: 404 })
        if (wallpaper.userId !== userId) return new NextResponse("Forbidden", { status: 403 })

        const filename = wallpaper.url.split('/').pop()
        const filepath = path.join(WALLPAPERS_DIR, filename)

        try {
            await fs.unlink(filepath)
        } catch (error) {
            console.error('Error deleting file:', error)
        }

        config.wallpapers = config.wallpapers.filter((w: any) => w.id !== id)
        await fs.writeFile(WALLPAPERS_CONFIG, JSON.stringify(config, null, 2))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return new NextResponse("Error deleting wallpaper: " + error.message, { status: 500 })
    }
}
