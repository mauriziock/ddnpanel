"use client"

import { LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWindows } from './WindowContext'
import { useSettings } from './SettingsContext'
import SettingsClient from '@/app/settings/SettingsClient'

export default function MacMenuBar({ isLoggedIn = true, user }: { isLoggedIn?: boolean, user?: any }) {
    const { t } = useSettings()
    const { openWindow } = useWindows()
    const [time, setTime] = useState('')

    useEffect(() => {
        const updateTime = () => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }
        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' })
            // Force full page reload to clear all state
            window.location.href = '/login'
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const handleOpenSettings = () => {
        openWindow('settings', t('settings'), <SettingsClient user={user} />)
    }

    return (
        <div className="fixed top-0 left-0 right-0 h-7 bg-black/30 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-[9999] select-none shadow-lg">
            {/* Left side - App name */}
            <div className="flex items-center gap-4 text-white text-sm">
                <span className="font-semibold">{t('dashboard')}</span>
                {isLoggedIn && (
                    <>
                        <span className="text-white/40">|</span>
                        <button
                            onClick={handleOpenSettings}
                            className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
                        >
                            <SettingsIcon className="w-3 h-3" />
                            {t('settings')}
                        </button>
                    </>
                )}
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center gap-3">
                <span className="text-white/60 text-xs">{time}</span>
                {isLoggedIn && (
                    <button
                        onClick={handleLogout}
                        className="text-white/70 hover:text-white transition-colors flex items-center gap-1 text-sm"
                    >
                        <LogOut className="w-3 h-3" />
                        {t('logout')}
                    </button>
                )}
            </div>
        </div>
    )
}
