import http from 'http'

interface DockerResponse {
    status: number | undefined
    data: any
}

export function dockerRequest(urlPath: string, method: string = 'GET', body?: object): Promise<DockerResponse> {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : undefined
        const req = http.request({
            socketPath: '/var/run/docker.sock',
            path: urlPath,
            method,
            headers: {
                'Host': 'localhost',
                ...(bodyStr ? {
                    'Content-Type': 'application/json',
                    'Content-Length': String(Buffer.byteLength(bodyStr))
                } : {})
            }
        }, (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null })
                } catch {
                    resolve({ status: res.statusCode, data })
                }
            })
        })
        req.on('error', reject)
        if (bodyStr) req.write(bodyStr)
        req.end()
    })
}
