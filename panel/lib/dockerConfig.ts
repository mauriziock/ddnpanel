import { promises as fs } from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'config', 'docker.json')

export interface DockerConfig {
    protectedContainers: string[]
}

export async function getDockerConfig(): Promise<DockerConfig> {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8')
        return JSON.parse(data)
    } catch {
        return { protectedContainers: [] }
    }
}

export async function saveDockerConfig(config: DockerConfig): Promise<void> {
    await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true })
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
}
