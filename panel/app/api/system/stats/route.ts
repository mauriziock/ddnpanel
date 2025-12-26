import { NextResponse } from 'next/server'
import si from 'systeminformation'

export async function GET() {
    try {
        const [cpu, mem, disk] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize()
        ])

        const stats = {
            cpu: {
                usage: Math.round(cpu.currentLoad),
                cores: cpu.cpus.length
            },
            memory: {
                total: mem.total,
                used: mem.total - mem.available,
                free: mem.available,
                usagePercent: Math.round(((mem.total - mem.available) / mem.total) * 100)
            },
            disk: {
                total: disk[0]?.size || 0,
                used: disk[0]?.used || 0,
                free: disk[0]?.available || 0,
                usagePercent: Math.round((disk[0]?.use || 0))
            }
        }

        return NextResponse.json(stats)
    } catch (error: any) {
        console.error('Error fetching system stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch system stats' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'
