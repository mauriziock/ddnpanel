import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcryptjs'

const USERS_FILE = path.join(process.cwd(), 'config', 'users.json')

export interface FolderAccess {
    path: string
    name?: string // Custom display name
    isDisk?: boolean // Mark as disk/drive
    icon?: string // Icon type: 'folder', 'music', 'pictures', 'documents', 'videos', 'downloads'
}

export interface User {
    id: string
    username: string
    password: string // hashed
    role: 'admin' | 'user'
    folders: FolderAccess[] // Array of folder access with metadata
    wallpaper?: string // URL or path to wallpaper image
}

// Ensure config directory and users file exist
async function ensureUsersFile() {
    const configDir = path.dirname(USERS_FILE)

    try {
        await fs.access(configDir)
    } catch {
        await fs.mkdir(configDir, { recursive: true })
    }

    // Ensure storage root directories exist
    const STORAGE_ROOT = path.resolve(process.cwd(), 'files-storage')
    try {
        await fs.mkdir(path.join(STORAGE_ROOT, 'shared'), { recursive: true })
        await fs.mkdir(path.join(STORAGE_ROOT, 'public'), { recursive: true })
        await fs.mkdir(path.join(STORAGE_ROOT, 'users'), { recursive: true })
    } catch (error) {
        console.error('Error creating default storage directories:', error)
    }

    try {
        await fs.access(USERS_FILE)
    } catch {
        // Create default admin user
        const defaultAdmin: User = {
            id: '1',
            username: 'admin',
            password: await bcrypt.hash('admin', 10),
            role: 'admin',
            folders: [{ path: '/', name: 'Root', isDisk: true }], // Admin has access to root
            wallpaper: '/wallpapers/wallpaper_1.png' // Default wallpaper (Silk Flow)
        }
        await fs.writeFile(USERS_FILE, JSON.stringify([defaultAdmin], null, 2))
    }
}

export async function getUsers(): Promise<User[]> {
    await ensureUsersFile()
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
}

export async function getUserById(id: string): Promise<User | null> {
    const users = await getUsers()
    return users.find(u => u.id === id) || null
}

export async function getUserByUsername(username: string): Promise<User | null> {
    const users = await getUsers()
    return users.find(u => u.username === username) || null
}

export async function createUser(userData: Omit<User, 'id' | 'password'> & { password: string }): Promise<User> {
    const users = await getUsers()

    // Set up default folders for the user
    const userHomePath = `/users/${userData.username}`
    const defaultFolders: FolderAccess[] = [
        // User's personal folders (Windows-style)
        { path: userHomePath, name: 'Home', isDisk: false, icon: 'folder' },
        { path: `${userHomePath}/Documents`, name: 'Documents', isDisk: false, icon: 'documents' },
        { path: `${userHomePath}/Downloads`, name: 'Downloads', isDisk: false, icon: 'downloads' },
        { path: `${userHomePath}/Pictures`, name: 'Pictures', isDisk: false, icon: 'pictures' },
        { path: `${userHomePath}/Music`, name: 'Music', isDisk: false, icon: 'music' },
        { path: `${userHomePath}/Videos`, name: 'Videos', isDisk: false, icon: 'videos' },
        // Shared folders (accessible to all users)
        { path: '/shared', name: 'Shared', isDisk: false, icon: 'folder' },
        { path: '/public', name: 'Public', isDisk: false, icon: 'folder' }
    ]

    const newUser: User = {
        ...userData,
        id: String(Date.now()),
        password: await bcrypt.hash(userData.password, 10),
        folders: (userData.folders && userData.folders.length > 0) ? userData.folders : defaultFolders, // Use provided folders or defaults
        wallpaper: userData.wallpaper || '/wallpapers/wallpaper_1.png' // Default wallpaper (Silk Flow)
    }

    // Create user's directory structure on filesystem
    const STORAGE_ROOT = path.resolve(process.cwd(), 'files-storage')
    const userDirPath = path.join(STORAGE_ROOT, 'users', userData.username)

    try {
        // Create user home directory and subdirectories
        await fs.mkdir(path.join(userDirPath, 'Documents'), { recursive: true })
        await fs.mkdir(path.join(userDirPath, 'Downloads'), { recursive: true })
        await fs.mkdir(path.join(userDirPath, 'Pictures'), { recursive: true })
        await fs.mkdir(path.join(userDirPath, 'Music'), { recursive: true })
        await fs.mkdir(path.join(userDirPath, 'Videos'), { recursive: true })

        // Create shared and public directories if they don't exist
        await fs.mkdir(path.join(STORAGE_ROOT, 'shared'), { recursive: true })
        await fs.mkdir(path.join(STORAGE_ROOT, 'public'), { recursive: true })

        // Directory structure created
    } catch (error) {
        console.error(`Failed to create directories for user ${userData.username}:`, error)
    }

    users.push(newUser)
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
    return newUser
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | null> {
    const users = await getUsers()
    const index = users.findIndex(u => u.id === id)

    if (index === -1) return null

    if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10)
    }

    users[index] = { ...users[index], ...updates }
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
    return users[index]
}

export async function deleteUser(id: string): Promise<boolean> {
    const users = await getUsers()
    const filtered = users.filter(u => u.id !== id)

    if (filtered.length === users.length) return false

    await fs.writeFile(USERS_FILE, JSON.stringify(filtered, null, 2))
    return true
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password)
}
