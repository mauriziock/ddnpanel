"use client"

import { useEffect, useState } from 'react'
import { Cpu, HardDrive, MemoryStick } from 'lucide-react'

interface SystemStats {
    cpu: {
        usage: number
        cores: number
    }
    memory: {
        total: number
        used: number
        free: number
        usagePercent: number
    }
    disk: {
        total: number
        used: number
        free: number
        usagePercent: number
    }
}

export default function SystemWidgets() {
    const [stats, setStats] = useState<SystemStats | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/system/stats')
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (error) {
                console.error('Failed to fetch system stats:', error)
            }
        }

        fetchStats()
        const interval = setInterval(fetchStats, 3000) // Update every 3 seconds

        return () => clearInterval(interval)
    }, [])

    const formatBytes = (bytes: number) => {
        const gb = bytes / (1024 ** 3)
        return gb.toFixed(1) + ' GB'
    }

    if (!stats) {
        return (
            <div className="flex items-center gap-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 animate-pulse w-32 h-14"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3">
            {/* CPU Widget */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm border border-white/20 shadow-lg min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60">CPU</span>
                            <span className="font-semibold text-xs">{stats.cpu.usage}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mt-1">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500 rounded-full"
                                style={{ width: `${stats.cpu.usage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RAM Widget */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm border border-white/20 shadow-lg min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                    <MemoryStick className="w-4 h-4 text-purple-400" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60">RAM</span>
                            <span className="font-semibold text-xs">{stats.memory.usagePercent}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mt-1">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 rounded-full"
                                style={{ width: `${stats.memory.usagePercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Disk Widget */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm border border-white/20 shadow-lg min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="w-4 h-4 text-green-400" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60">Disk</span>
                            <span className="font-semibold text-xs">{stats.disk.usagePercent}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mt-1">
                            <div
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                                style={{ width: `${stats.disk.usagePercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
