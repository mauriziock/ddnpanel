'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import DarkVeil from '@/components/DarkVeil'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await signIn('credentials', {
            username,
            password,
            redirect: false,
        })

        if (result?.ok) {
            window.location.href = '/'
        } else {
            alert('Invalid credentials')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center relative">
            <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 0 }}>
                <DarkVeil />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                    <h2 className="mb-8 text-center text-3xl font-bold text-white drop-shadow-lg">
                        Welcome Back
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/90">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/90">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 py-3 font-semibold text-white hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
