import Link from 'next/link'
import { auth } from '@/auth'
import { signOut } from '@/auth'

export default async function Sidebar() {
    const session = await auth()
    const user = session?.user

    let usage = null
    if (user) {
        const { getUserUsage } = await import("@/lib/profiles")
        usage = await getUserUsage(parseInt(user.id), user.name!)
    }

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    return (
        <div className="flex h-screen w-64 flex-col bg-[#2c3e50] text-white">
            <div className="flex h-16 items-center justify-center bg-[#1a252f] shadow-md">
                <h1 className="text-xl font-bold tracking-wider">DDN HOSTING</h1>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    <Link
                        href="/"
                        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-[#34495e] hover:text-white"
                    >
                        <svg className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                    </Link>

                    {user?.role === 'admin' && (
                        <>
                            <Link
                                href="/admin/users"
                                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-[#34495e] hover:text-white"
                            >
                                <svg className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Users
                            </Link>
                            <Link
                                href="/admin/profiles"
                                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-[#34495e] hover:text-white"
                            >
                                <svg className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Profiles
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-[#34495e] hover:text-white"
                            >
                                <svg className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </Link>
                        </>
                    )}
                </nav>
            </div>

            <div className="bg-[#233140] p-4">
                <div className="flex items-center">
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">{user?.name}</p>
                        <p className="text-xs font-medium text-gray-300 capitalize">{user?.role}</p>
                    </div>
                </div>

                {usage && (
                    <div className="mt-4 space-y-3">
                        {/* Storage Usage */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Storage</span>
                                <span>{formatBytes(usage.storage.used)} / {formatBytes(usage.storage.limit)}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-700">
                                <div
                                    className={`h-2 rounded-full ${usage.storage.used >= usage.storage.limit ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min((usage.storage.used / usage.storage.limit) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Database Usage */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Databases</span>
                                <span>{usage.database.used} / {usage.database.limit}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-700">
                                <div
                                    className={`h-2 rounded-full ${usage.database.used >= usage.database.limit ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min((usage.database.used / usage.database.limit) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Sites Usage */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Sites</span>
                                <span>{usage.sites.used} / {usage.sites.limit}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-700">
                                <div
                                    className={`h-2 rounded-full ${usage.sites.used >= usage.sites.limit ? 'bg-red-500' : 'bg-purple-500'}`}
                                    style={{ width: `${Math.min((usage.sites.used / usage.sites.limit) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-3">
                    <form action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                    }}>
                        <button type="submit" className="block w-full rounded-md bg-[#e74c3c] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#c0392b]">
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
