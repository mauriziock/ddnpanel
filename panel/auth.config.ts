import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnLoginPage = nextUrl.pathname.startsWith('/login')

            if (isOnLoginPage) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
                return true
            }

            if (!isLoggedIn) {
                return false // Redirect to login
            }
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.username = user.username
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
                session.user.username = token.username as string
            }
            return session
        },
    },
    providers: [], // Providers added in auth.ts
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthConfig
