import { auth } from "@/auth"
import SystemMenuBar from "./SystemMenuBar"

export default async function ConditionalMenuBar() {
    const session = await auth()

    // Always show menu bar, but pass login status and user info
    return <SystemMenuBar isLoggedIn={!!session?.user} user={session?.user} />
}
