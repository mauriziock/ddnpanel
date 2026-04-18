import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const dynamic = 'force-dynamic'

const WALLPAPERS_DIR = path.join(process.cwd(), 'files-storage', 'wallpapers')

const MIME_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { filename } = await params

    // Prevent path traversal
    const safe = path.basename(filename)
    const filepath = path.join(WALLPAPERS_DIR, safe)

    try {
        const buffer = await fs.readFile(filepath)
        const ext = safe.split('.').pop()?.toLowerCase() ?? ''
        const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch {
        return new NextResponse("Not found", { status: 404 })
    }
}
