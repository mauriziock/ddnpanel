import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { dockerRequest } from '@/lib/docker'
import { getDockerConfig } from '@/lib/dockerConfig'

export const dynamic = 'force-dynamic'

async function isProtected(id: string): Promise<boolean> {
    const config = await getDockerConfig()
    if (config.protectedContainers.length === 0) return false

    const { data } = await dockerRequest(`/containers/${id}/json`)
    if (!data) return false

    const name = (data.Name as string)?.replace(/^\//, '')
    return config.protectedContainers.includes(name) || config.protectedContainers.includes(id)
}

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { id } = await params

    if (session.user.role !== 'admin') {
        if (await isProtected(id)) {
            return new NextResponse('Forbidden: container is protected', { status: 403 })
        }
    }

    try {
        const { status } = await dockerRequest(`/containers/${id}/start`, 'POST')
        if (status === 204 || status === 304) {
            return NextResponse.json({ success: true })
        }
        return new NextResponse('Failed to start container', { status: 502 })
    } catch (error: any) {
        return new NextResponse('Error: ' + error.message, { status: 500 })
    }
}
