import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const SHORTCUTS_FILE = path.join(process.cwd(), 'config', 'shortcuts.json')

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const newOrder = await req.json()
        await fs.writeFile(SHORTCUTS_FILE, JSON.stringify(newOrder, null, 2))
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return new NextResponse("Error reordering shortcuts: " + error.message, { status: 500 })
    }
}
