import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { getUsers, createUser, updateUser } from "@/lib/users"

export async function GET() {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const users = await getUsers()
        // Don't send passwords
        const safeUsers = users.map(({ password, ...user }) => user)
        return NextResponse.json(safeUsers)
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { username, password, role, folders } = await req.json()

        if (!username || !password) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const newUser = await createUser({
            username,
            password,
            role: role || 'user',
            folders: folders || ['/shared']
        })

        const { password: _, ...safeUser } = newUser
        return NextResponse.json(safeUser)
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id, wallpaper, ...otherUpdates } = await req.json()

        if (!id) {
            return new NextResponse("Missing user ID", { status: 400 })
        }

        // Users can only update their own wallpaper, admins can update anyone
        if (session.user.id !== id && session.user.role !== 'admin') {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const updates: any = {}
        if (wallpaper !== undefined) updates.wallpaper = wallpaper

        // Only admins can update other fields
        if (session.user.role === 'admin') {
            Object.assign(updates, otherUpdates)
        }

        const updatedUser = await updateUser(id, updates)

        if (!updatedUser) {
            return new NextResponse("User not found", { status: 404 })
        }

        const { password: _, ...safeUser } = updatedUser
        return NextResponse.json(safeUser)
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}
