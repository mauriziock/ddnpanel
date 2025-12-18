import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { updateUser } from "@/lib/users"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    // Users can only change their own password
    if (session.user.id !== id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const { password } = await req.json()

        if (!password || password.length < 4) {
            return new NextResponse("Password must be at least 4 characters", { status: 400 })
        }

        const updatedUser = await updateUser(id, { password })
        if (!updatedUser) {
            return new NextResponse("User not found", { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}
