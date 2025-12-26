
export interface UsageStats {
    used: number
    limit: number
}

export interface UserUsage {
    storage: UsageStats
    database: UsageStats
    sites: UsageStats
}

export async function getUserUsage(userId: number, username: string): Promise<UserUsage> {
    // Stub implementation to fix build
    // In a real implementation, this would query the database or file system
    return {
        storage: {
            used: 0,
            limit: 10 * 1024 * 1024 * 1024 // 10 GB
        },
        database: {
            used: 0,
            limit: 5
        },
        sites: {
            used: 0,
            limit: 3
        }
    }
}
