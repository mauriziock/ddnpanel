import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { writeFile } from "fs/promises"

const WALLPAPERS_DIR = path.join(process.cwd(), 'public', 'wallpapers')
const WALLPAPERS_CONFIG = path.join(process.cwd(), 'config', 'wallpapers.json')

// Ensure directories exist
async function ensureDirectories() {
    try {
        await fs.access(WALLPAPERS_DIR)
    } catch {
        await fs.mkdir(WALLPAPERS_DIR, { recursive: true })
    }

    try {
        await fs.access(WALLPAPERS_CONFIG)
    } catch {
        await fs.writeFile(WALLPAPERS_CONFIG, JSON.stringify({ wallpapers: [] }))
    }
}

// GET - List all wallpapers
export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        await ensureDirectories()
        const data = await fs.readFile(WALLPAPERS_CONFIG, 'utf-8')
        const config = JSON.parse(data)
        return NextResponse.json(config.wallpapers || [])
    } catch (error: any) {
        return new NextResponse("Error reading wallpapers: " + error.message, { status: 500 })
    }
}

// POST - Upload new wallpaper
export async function POST(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        await ensureDirectories()

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return new NextResponse("No file provided", { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return new NextResponse("File must be an image", { status: 400 })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const extension = file.name.split('.').pop()
        const filename = `wallpaper_${timestamp}.${extension}`
        const filepath = path.join(WALLPAPERS_DIR, filename)

        // Save file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Update config
        const data = await fs.readFile(WALLPAPERS_CONFIG, 'utf-8')
        const config = JSON.parse(data)

        const newWallpaper = {
            id: timestamp.toString(),
            url: `/wallpapers/${filename}`,
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

// DELETE - Remove wallpaper
export async function DELETE(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { id } = await req.json()

        await ensureDirectories()
        const data = await fs.readFile(WALLPAPERS_CONFIG, 'utf-8')
        const config = JSON.parse(data)

        const wallpaper = config.wallpapers.find((w: any) => w.id === id)
        if (!wallpaper) {
            return new NextResponse("Wallpaper not found", { status: 404 })
        }

        // Delete file
        const filename = wallpaper.url.split('/').pop()
        const filepath = path.join(WALLPAPERS_DIR, filename)

        try {
            await fs.unlink(filepath)
        } catch (error) {
            console.error('Error deleting file:', error)
        }

        // Update config
        config.wallpapers = config.wallpapers.filter((w: any) => w.id !== id)
        await fs.writeFile(WALLPAPERS_CONFIG, JSON.stringify(config, null, 2))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return new NextResponse("Error deleting wallpaper: " + error.message, { status: 500 })
    }
}
