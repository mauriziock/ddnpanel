import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import { getUserById } from "@/lib/users"

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  // Get fresh user data from database (includes latest wallpaper)
  const freshUser = await getUserById(session.user.id)

  if (!freshUser) {
    redirect("/login")
  }

  // Remove password before sending to client
  const { password, ...safeUser } = freshUser

  return <DashboardClient user={safeUser} />
}
