import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"
import { getUserById } from "@/lib/users"

export default async function SettingsPage() {
    const session = await auth()
    if (!session) redirect("/login")

    // Get fresh user data from database (includes latest wallpaper)
    const freshUser = await getUserById(session.user.id)

    if (!freshUser) {
        redirect("/login")
    }

    // Remove password before sending to client
    const { password, ...safeUser } = freshUser

    return <SettingsClient user={safeUser} />
}
