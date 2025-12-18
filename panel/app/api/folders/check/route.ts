import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_ROOT = path.resolve(process.cwd(), "files-storage")

export async function POST(req: Request) {
    try {
        const { path: folderPath } = await req.json()

        if (!folderPath) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 })
        }

        const fullPath = path.resolve(STORAGE_ROOT, folderPath.replace(/^\/+/, ''))

        // Check if path is within storage root (security)
        if (!fullPath.startsWith(STORAGE_ROOT)) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
        }

        try {
            const stats = await fs.stat(fullPath)
            return NextResponse.json({
                exists: true,
                isDirectory: stats.isDirectory(),
                path: folderPath
            })
        } catch (error) {
            return NextResponse.json({
                exists: false,
                isDirectory: false,
                path: folderPath
            })
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const { path: folderPath } = await req.json()

        if (!folderPath) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 })
        }

        const fullPath = path.resolve(STORAGE_ROOT, folderPath.replace(/^\/+/, ''))

        // Check if path is within storage root (security)
        if (!fullPath.startsWith(STORAGE_ROOT)) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
        }

        // Create directory
        await fs.mkdir(fullPath, { recursive: true })

        return NextResponse.json({
            success: true,
            path: folderPath
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
