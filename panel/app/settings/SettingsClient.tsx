"use client"

import { useState, useEffect } from 'react'
import { Users, FolderOpen, Plus, Trash2, Edit2, Save, X, HardDrive, User as UserIcon, Image, Upload, Palette } from 'lucide-react'
import { folderIcons, getFolderIcon } from '@/lib/folderIcons'
import UserProfile from '@/components/UserProfile'
import { useSettings } from '@/components/SettingsContext'
import { type User, type FolderAccess } from '@/lib/users'
import { DEFAULT_WALLPAPERS, type Wallpaper } from '@/lib/wallpapers'

export default function SettingsClient({ user }: { user: any }) {
    const { t, language, setLanguage, theme, setTheme } = useSettings()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'users' | 'folders' | 'profile'>(user.role === 'admin' ? 'users' : 'profile')

    // Wallpaper state
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
    const [editWallpapers, setEditWallpapers] = useState(false)
    const [uploadingWallpaper, setUploadingWallpaper] = useState(false)
    const [allWallpapers, setAllWallpapers] = useState<Wallpaper[]>([...DEFAULT_WALLPAPERS])
    const [selectedWallpaper, setSelectedWallpaper] = useState<string>(user.wallpaper || DEFAULT_WALLPAPERS[0].url)
    const [pendingWallpaperChange, setPendingWallpaperChange] = useState(false)
    const [showApplyModal, setShowApplyModal] = useState(false)

    // User form state
    const [showUserForm, setShowUserForm] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'user' as 'admin' | 'user',
        folders: [] as FolderAccess[],
        wallpaper: DEFAULT_WALLPAPERS[0].url
    })

    // Folder management
    const [availableFolders, setAvailableFolders] = useState<FolderAccess[]>([
        { path: '/shared', name: 'Shared', isDisk: false },
        { path: '/public', name: 'Public', isDisk: false }
    ])
    const [newFolderPath, setNewFolderPath] = useState('')
    const [newFolderName, setNewFolderName] = useState('')
    const [newFolderIsDisk, setNewFolderIsDisk] = useState(false)
    const [newFolderIcon, setNewFolderIcon] = useState<string>('folder')
    const [folderExists, setFolderExists] = useState<boolean | null>(null)
    const [checkingFolder, setCheckingFolder] = useState(false)
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [editingFolderPath, setEditingFolderPath] = useState<string | null>(null)
    const [editingFolderName, setEditingFolderName] = useState('')
    const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all')

    useEffect(() => {
        fetchUsers()
        fetchFolderConfig()
        fetchWallpapers()
    }, [])

    const fetchWallpapers = async () => {
        try {
            const res = await fetch('/api/wallpapers')
            if (res.ok) {
                const customWallpapers = await res.json()
                setWallpapers(customWallpapers)
                // Combine defaults + custom (max 8 custom)
                setAllWallpapers([...DEFAULT_WALLPAPERS, ...customWallpapers.slice(0, 8)])
            }
        } catch (error) {
            console.error('Failed to fetch wallpapers:', error)
        }
    }

    const handleUploadWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check limit (4 defaults + 8 custom = 12 total)
        if (wallpapers.length >= 8) {
            alert('Maximum 8 custom wallpapers allowed. Please delete some first.')
            return
        }

        setUploadingWallpaper(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/wallpapers', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                await fetchWallpapers()
            }
        } catch (error) {
            console.error('Failed to upload wallpaper:', error)
        } finally {
            setUploadingWallpaper(false)
        }
    }

    const handleDeleteWallpaper = async (id: string) => {
        try {
            const res = await fetch('/api/wallpapers', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })

            if (res.ok) {
                await fetchWallpapers()
            }
        } catch (error) {
            console.error('Failed to delete wallpaper:', error)
        }
    }

    const handleSetWallpaper = async (url: string) => {
        console.log('🎨 Setting wallpaper:', url)
        console.log('👤 User ID:', user.id)

        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    wallpaper: url
                })
            })

            const data = await res.json()

            if (res.ok) {
                // Update selected wallpaper and show pending changes
                setSelectedWallpaper(url)
                setPendingWallpaperChange(true)
                console.log('✅ Wallpaper saved successfully')
            } else {
                console.error('❌ Failed to save wallpaper:', data)
            }
        } catch (error) {
            console.error('💥 Error setting wallpaper:', error)
        }
    }

    const handleApplyChanges = () => {
        setShowApplyModal(true)
    }

    const confirmApplyChanges = () => {
        window.location.reload()
    }

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                // Normalize old format to new format
                const normalizedUsers = data.map((user: any) => ({
                    ...user,
                    folders: user.folders.map((f: any) =>
                        typeof f === 'string' ? { path: f } : f
                    )
                }))
                setUsers(normalizedUsers)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchFolderConfig = async () => {
        try {
            const res = await fetch('/api/folders/config')
            if (res.ok) {
                const data = await res.json()
                if (data.length > 0) {
                    setAvailableFolders(data)
                }
            }
        } catch (error) {
            console.error('Failed to fetch folder config:', error)
        }
    }

    const saveFolderConfig = async (folders: FolderAccess[]) => {
        try {
            await fetch('/api/folders/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(folders)
            })
        } catch (error) {
            console.error('Failed to save folder config:', error)
        }
    }

    const handleCreateUser = async () => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                fetchUsers()
                resetForm()
            } else {
                alert('Failed to create user')
            }
        } catch (error) {
            alert('Error creating user')
        }
    }

    const handleUpdateUser = async () => {
        if (!editingUser) return

        try {
            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    role: formData.role,
                    folders: formData.folders,
                    wallpaper: formData.wallpaper
                })
            })

            if (res.ok) {
                fetchUsers()
                resetForm()
            } else {
                alert('Failed to update user')
            }
        } catch (error) {
            alert('Error updating user')
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchUsers()
            } else {
                alert('Failed to delete user')
            }
        } catch (error) {
            alert('Error deleting user')
        }
    }

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            role: 'user',
            folders: [],
            wallpaper: DEFAULT_WALLPAPERS[0].url
        })
        setEditingUser(null)
        setShowUserForm(false)
    }

    const startEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            username: user.username,
            password: '',
            role: user.role,
            folders: user.folders,
            wallpaper: user.wallpaper || DEFAULT_WALLPAPERS[0].url
        })
        setShowUserForm(true)
    }

    const toggleFolder = (folder: FolderAccess) => {
        setFormData(prev => {
            const exists = prev.folders.some(f => f.path === folder.path)
            return {
                ...prev,
                folders: exists
                    ? prev.folders.filter(f => f.path !== folder.path)
                    : [...prev.folders, folder]
            }
        })
    }

    const checkFolderExists = async (path: string) => {
        if (!path.trim()) {
            setFolderExists(null)
            return
        }

        setCheckingFolder(true)
        try {
            const res = await fetch('/api/folders/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            })

            if (res.ok) {
                const data = await res.json()
                setFolderExists(data.exists && data.isDirectory)
            }
        } catch (error) {
            console.error('Failed to check folder:', error)
            setFolderExists(null)
        } finally {
            setCheckingFolder(false)
        }
    }

    const createFolder = async () => {
        if (!newFolderPath.trim()) return

        const path = newFolderPath.startsWith('/') ? newFolderPath : '/' + newFolderPath
        setCreatingFolder(true)

        try {
            const res = await fetch('/api/folders/check', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            })

            if (res.ok) {
                setFolderExists(true)

                // Add to available folders immediately
                const newFolder: FolderAccess = {
                    path,
                    name: newFolderName.trim() || undefined,
                    isDisk: newFolderIsDisk,
                    icon: newFolderIsDisk ? undefined : newFolderIcon
                }

                const updatedFolders = [...availableFolders, newFolder]
                setAvailableFolders(updatedFolders)
                await saveFolderConfig(updatedFolders)

                alert('Folder created successfully!')
            } else {
                alert('Failed to create folder')
            }
        } catch (error) {
            alert('Error creating folder')
        } finally {
            setCreatingFolder(false)
        }
    }

    const addNewFolder = () => {
        if (!newFolderPath.trim()) return
        const path = newFolderPath.startsWith('/') ? newFolderPath : '/' + newFolderPath

        if (availableFolders.some(f => f.path === path)) {
            alert('Folder already exists')
            return
        }

        const newFolder: FolderAccess = {
            path,
            name: newFolderName.trim() || undefined,
            isDisk: newFolderIsDisk,
            icon: newFolderIsDisk ? undefined : newFolderIcon
        }

        const updatedFolders = [...availableFolders, newFolder]
        setAvailableFolders(updatedFolders)
        saveFolderConfig(updatedFolders)

        setNewFolderPath('')
        setNewFolderName('')
        setNewFolderIsDisk(false)
        setNewFolderIcon('folder')
        setFolderExists(null)
    }

    const removeFolder = (folderPath: string) => {
        if (!confirm(`Remove folder "${folderPath}"? Users with access will lose it.`)) return

        const updatedFolders = availableFolders.filter(f => f.path !== folderPath)
        setAvailableFolders(updatedFolders)
        saveFolderConfig(updatedFolders)

        // Also remove from all users
        setUsers(users.map(u => ({
            ...u,
            folders: u.folders.filter(f => f.path !== folderPath)
        })))
    }

    const startEditFolder = (folder: FolderAccess) => {
        setEditingFolderPath(folder.path)
        setEditingFolderName(folder.name || '')
    }

    const saveEditFolder = () => {
        if (!editingFolderPath) return

        const updatedFolders = availableFolders.map(f =>
            f.path === editingFolderPath
                ? { ...f, name: editingFolderName.trim() || undefined }
                : f
        )

        setAvailableFolders(updatedFolders)
        saveFolderConfig(updatedFolders)
        setEditingFolderPath(null)
        setEditingFolderName('')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
                    <p className="text-gray-600 mt-2">{t('settings.subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200">
                        {user.role === 'admin' && (
                            <>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'users'
                                        ? 'border-b-2 border-primary-500 text-primary-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Users className="w-5 h-5 mr-2" />
                                    {t('tabs.users')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('folders')}
                                    className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'folders'
                                        ? 'border-b-2 border-primary-500 text-primary-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <FolderOpen className="w-5 h-5 mr-2" />
                                    {t('tabs.folders')}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'profile'
                                ? 'border-b-2 border-primary-500 text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <UserIcon className="w-5 h-5 mr-2" />
                            {t('tabs.profile')}
                        </button>
                    </div>

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">User Management</h2>
                                <button
                                    onClick={() => setShowUserForm(true)}
                                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add User
                                </button>
                            </div>

                            {/* User Form */}
                            {showUserForm && (
                                <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold mb-4">
                                        {editingUser ? 'Edit User' : 'Create New User'}
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="Enter username"
                                            />
                                        </div>

                                        {!editingUser && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder="Enter password"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Role
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Default Wallpaper
                                        </label>
                                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                            {allWallpapers.map((wp) => (
                                                <div
                                                    key={wp.id}
                                                    onClick={() => setFormData({ ...formData, wallpaper: wp.url })}
                                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${formData.wallpaper === wp.url
                                                        ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md'
                                                        : 'border-transparent hover:border-gray-300'
                                                        }`}
                                                >
                                                    <img src={wp.url} className="w-full h-full object-cover" alt={wp.name} />
                                                    {formData.wallpaper === wp.url && (
                                                        <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center">
                                                            <div className="bg-primary-600 rounded-full p-0.5 shadow-lg border border-white">
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Folder Access
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {availableFolders.map(folder => (
                                                <label key={folder.path} className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.folders.some(f => f.path === folder.path)}
                                                        onChange={() => toggleFolder(folder)}
                                                        className="mr-3"
                                                    />
                                                    {folder.isDisk ? (
                                                        <HardDrive className="w-4 h-4 mr-2 text-gray-600" />
                                                    ) : (
                                                        <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{folder.name || folder.path}</div>
                                                        {folder.name && <div className="text-xs text-gray-500">{folder.path}</div>}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {editingUser ? 'Update' : 'Create'}
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Users List */}
                            <div className="space-y-2">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-gray-900">{user.username}</h3>
                                                <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Access: {user.folders.length > 0
                                                    ? user.folders.map(f => f.name || f.path).join(', ')
                                                    : 'No folders'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Folders Tab */}
                    {activeTab === 'folders' && (
                        <div className="p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-4">Shared Folders</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Create folders that can be shared between multiple users. Mark folders as "Disk" to show them with a drive icon.
                                </p>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                    <h3 className="font-medium mb-3">Add New Folder</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Path *</label>
                                            <input
                                                type="text"
                                                value={newFolderPath}
                                                onChange={(e) => {
                                                    setNewFolderPath(e.target.value)
                                                    const path = e.target.value.startsWith('/') ? e.target.value : '/' + e.target.value
                                                    checkFolderExists(path)
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="/folder-name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Display Name</label>
                                            <input
                                                type="text"
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="My Folder (optional)"
                                            />
                                        </div>
                                    </div>

                                    {/* Folder Status */}
                                    {newFolderPath && (
                                        <div className={`mb-3 p-2 rounded-lg text-sm ${checkingFolder ? 'bg-gray-100 text-gray-600' :
                                            folderExists === true ? 'bg-green-50 text-green-700' :
                                                folderExists === false ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {checkingFolder ? '🔍 Checking...' :
                                                folderExists === true ? '✅ Folder exists' :
                                                    folderExists === false ? '⚠️ Folder doesn\'t exist' :
                                                        ''}
                                        </div>
                                    )}

                                    {/* Icon Selector */}
                                    {!newFolderIsDisk && (
                                        <div className="mb-3">
                                            <label className="block text-xs text-gray-600 mb-2">Folder Icon</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {Object.entries(folderIcons).map(([key, config]) => {
                                                    const IconComponent = config.icon
                                                    return (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => setNewFolderIcon(key)}
                                                            className={`p-3 border-2 rounded-lg transition-all ${newFolderIcon === key
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <IconComponent className={`w-6 h-6 mx-auto ${config.color}`} />
                                                            <div className="text-xs mt-1 text-gray-600">{config.label}</div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newFolderIsDisk}
                                                onChange={(e) => setNewFolderIsDisk(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <HardDrive className="w-4 h-4 mr-2 text-gray-600" />
                                            <span className="text-sm">Mark as Disk/Drive</span>
                                        </label>
                                        <div className="flex gap-2">
                                            {folderExists === false && (
                                                <button
                                                    onClick={createFolder}
                                                    disabled={creatingFolder}
                                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    {creatingFolder ? 'Creating...' : 'Create Folder'}
                                                </button>
                                            )}
                                            <button
                                                onClick={addNewFolder}
                                                disabled={!newFolderPath.trim() || (folderExists === false)}
                                                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add to Settings
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Filter */}
                            <div className="mb-4 flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">Filter by user:</label>
                                <select
                                    value={selectedUserFilter}
                                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="all">All Folders ({availableFolders.length})</option>
                                    {users.map(user => {
                                        const folderCount = availableFolders.filter(f =>
                                            user.folders.some(uf => uf.path === f.path)
                                        ).length
                                        return (
                                            <option key={user.id} value={user.id}>
                                                {user.username} ({folderCount} folders)
                                            </option>
                                        )
                                    })}
                                    <option value="unassigned">Unassigned (0 users)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                {availableFolders
                                    .filter(folder => {
                                        if (selectedUserFilter === 'all') return true
                                        if (selectedUserFilter === 'unassigned') {
                                            return !users.some(u => u.folders.some(f => f.path === folder.path))
                                        }
                                        const user = users.find(u => u.id === selectedUserFilter)
                                        return user?.folders.some(f => f.path === folder.path)
                                    })
                                    .map(folder => {
                                        const usersWithAccess = users.filter(u => u.folders.some(f => f.path === folder.path))
                                        const iconConfig = getFolderIcon(folder.icon, folder.isDisk)
                                        const IconComponent = iconConfig.icon

                                        return (
                                            <div key={folder.path} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <IconComponent className={`w-5 h-5 ${iconConfig.color}`} />
                                                        <div className="flex-1">
                                                            {editingFolderPath === folder.path ? (
                                                                <input
                                                                    type="text"
                                                                    value={editingFolderName}
                                                                    onChange={(e) => setEditingFolderName(e.target.value)}
                                                                    className="px-2 py-1 border border-primary-500 rounded text-sm font-semibold"
                                                                    placeholder="Display name"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <h3 className="font-semibold text-gray-900">
                                                                    {folder.name || folder.path}
                                                                </h3>
                                                            )}
                                                            {folder.name && editingFolderPath !== folder.path && (
                                                                <p className="text-xs text-gray-500">{folder.path}</p>
                                                            )}
                                                        </div>
                                                        {folder.isDisk && (
                                                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Disk</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {usersWithAccess.length} user(s): {usersWithAccess.map(u => u.username).join(', ') || 'None'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {editingFolderPath === folder.path ? (
                                                        <>
                                                            <button
                                                                onClick={saveEditFolder}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingFolderPath(null)}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => startEditFolder(folder)}
                                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeFolder(folder.path)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="p-6">
                            <UserProfile
                                user={user}
                                allWallpapers={allWallpapers}
                                selectedWallpaper={selectedWallpaper}
                                handleSetWallpaper={handleSetWallpaper}
                                handleUploadWallpaper={handleUploadWallpaper}
                                handleDeleteWallpaper={handleDeleteWallpaper}
                                uploadingWallpaper={uploadingWallpaper}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Apply Changes Button (Floating) */}
            {pendingWallpaperChange && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={handleApplyChanges}
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg shadow-2xl hover:bg-primary-700 transition-all flex items-center gap-2 animate-bounce"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Apply Changes
                    </button>
                </div>
            )}

            {/* Apply Changes Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Apply Changes?</h3>
                            <p className="text-gray-600 mb-6">
                                The panel will reload to apply your new wallpaper. Any unsaved work in open windows will be lost.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowApplyModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmApplyChanges}
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                                >
                                    Reload Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
