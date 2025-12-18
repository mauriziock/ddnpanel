import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'config', 'folders.json')

interface FolderConfig {
    path: string
    name?: string
    isDisk?: boolean
    icon?: string
    parentPath?: string
}

async function ensureConfigFile() {
    const configDir = path.dirname(CONFIG_FILE)

    try {
        await fs.access(configDir)
    } catch {
        await fs.mkdir(configDir, { recursive: true })
    }

    try {
        await fs.access(CONFIG_FILE)
    } catch {
        await fs.writeFile(CONFIG_FILE, JSON.stringify([], null, 2))
    }
}

export async function GET() {
    try {
        await ensureConfigFile()
        const data = await fs.readFile(CONFIG_FILE, 'utf-8')
        return NextResponse.json(JSON.parse(data))
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        await ensureConfigFile()
        const folders: FolderConfig[] = await req.json()
        await fs.writeFile(CONFIG_FILE, JSON.stringify(folders, null, 2))
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
