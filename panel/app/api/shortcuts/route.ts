import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const SHORTCUTS_FILE = path.join(process.cwd(), 'config', 'shortcuts.json')

interface Shortcut {
    id: string
    name: string
    url: string
    icon: string
    color: string
}

// Ensure shortcuts file exists
async function ensureShortcutsFile() {
    try {
        await fs.access(SHORTCUTS_FILE)
    } catch {
        await fs.writeFile(SHORTCUTS_FILE, JSON.stringify([]))
    }
}

export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        await ensureShortcutsFile()
        const data = await fs.readFile(SHORTCUTS_FILE, 'utf-8')
        const shortcuts = JSON.parse(data)
        return NextResponse.json(shortcuts)
    } catch (error: any) {
        return new NextResponse("Error reading shortcuts: " + error.message, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const newShortcut = await req.json()

        await ensureShortcutsFile()
        const data = await fs.readFile(SHORTCUTS_FILE, 'utf-8')
        const shortcuts = JSON.parse(data)

        // Add ID if not present
        if (!newShortcut.id) {
            newShortcut.id = Date.now().toString()
        }

        shortcuts.push(newShortcut)
        await fs.writeFile(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 2))

        return NextResponse.json(newShortcut)
    } catch (error: any) {
        return new NextResponse("Error creating shortcut: " + error.message, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { id } = await req.json()

        await ensureShortcutsFile()
        const data = await fs.readFile(SHORTCUTS_FILE, 'utf-8')
        const shortcuts = JSON.parse(data)

        const filtered = shortcuts.filter((s: Shortcut) => s.id !== id)
        await fs.writeFile(SHORTCUTS_FILE, JSON.stringify(filtered, null, 2))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return new NextResponse("Error deleting shortcut: " + error.message, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const updated = await req.json()

        await ensureShortcutsFile()
        const data = await fs.readFile(SHORTCUTS_FILE, 'utf-8')
        const shortcuts = JSON.parse(data)

        const index = shortcuts.findIndex((s: Shortcut) => s.id === updated.id)
        if (index === -1) {
            return new NextResponse("Shortcut not found", { status: 404 })
        }

        shortcuts[index] = updated
        await fs.writeFile(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 2))

        return NextResponse.json(updated)
    } catch (error: any) {
        return new NextResponse("Error updating shortcut: " + error.message, { status: 500 })
    }
}
