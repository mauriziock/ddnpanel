import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { getUserById } from "@/lib/users"

export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const user = await getUserById(session.user.id)
        if (!user) {
            return new NextResponse("User not found", { status: 404 })
        }

        // Return user's folders with metadata
        return NextResponse.json(user.folders)
    } catch (error: any) {
        return new NextResponse("Internal Server Error: " + error.message, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
