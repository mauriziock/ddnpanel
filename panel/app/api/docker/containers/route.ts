import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { dockerRequest } from '@/lib/docker'
import { getDockerConfig } from '@/lib/dockerConfig'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const { status, data } = await dockerRequest('/containers/json?all=1')
        if (status !== 200) {
            return new NextResponse('Docker daemon error', { status: 502 })
        }

        const config = await getDockerConfig()
        const protectedSet = new Set(config.protectedContainers)

        const containers = (data as any[]).map((c) => {
            const name = (c.Names?.[0] as string)?.replace(/^\//, '') ?? c.Id.substring(0, 12)
            return {
                id: c.Id,
                shortId: c.Id.substring(0, 12) as string,
                name,
                image: c.Image as string,
                state: c.State as string,
                status: c.Status as string,
                protected: protectedSet.has(name) || protectedSet.has(c.Id as string),
            }
        })

        return NextResponse.json(containers)
    } catch (error: any) {
        return new NextResponse('Cannot connect to Docker: ' + error.message, { status: 500 })
    }
}
