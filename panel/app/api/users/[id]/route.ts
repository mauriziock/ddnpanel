import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { getUserById, updateUser, deleteUser } from "@/lib/users"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    // Users can only see their own data, admins can see anyone
    if (session.user.role !== 'admin' && session.user.id !== id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const user = await getUserById(id)
        if (!user) {
            return new NextResponse("User not found", { status: 404 })
        }

        const { password, ...safeUser } = user
        return NextResponse.json(safeUser)
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    // Users can only update their own data, admins can update anyone
    if (session.user.role !== 'admin' && session.user.id !== id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const updates = await req.json()

        // Non-admins can't change role or folders
        if (session.user.role !== 'admin') {
            delete updates.role
            delete updates.folders
        }

        const updatedUser = await updateUser(id, updates)
        if (!updatedUser) {
            return new NextResponse("User not found", { status: 404 })
        }

        const { password, ...safeUser } = updatedUser
        return NextResponse.json(safeUser)
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    try {
        const success = await deleteUser(id)
        if (!success) {
            return new NextResponse("User not found", { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}
