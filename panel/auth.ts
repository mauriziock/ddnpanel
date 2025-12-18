import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "@/auth.config"
import { getUserByUsername, verifyPassword } from "@/lib/users"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password) {
                    return null
                }

                const user = await getUserByUsername(credentials.username as string)

                if (!user) {
                    return null
                }

                const isValid = await verifyPassword(user, credentials.password as string)

                if (isValid) {
                    return {
                        id: user.id,
                        name: user.username,
                        username: user.username,
                        role: user.role,
                    }
                }

                return null
            },
        }),
    ],
})
