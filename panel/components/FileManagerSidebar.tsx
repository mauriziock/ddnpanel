"use client"

import { useEffect, useState } from 'react'
import { ChevronRight, HardDrive, Usb } from 'lucide-react'
import { getFolderIcon } from '@/lib/folderIcons'

interface FolderAccess {
    path: string
    name?: string
    isDisk?: boolean
    icon?: string
}



interface Drive {
    name: string
    path: string
    size: string
    type: string
    isRemovable: boolean
}

interface FileManagerSidebarProps {
    currentPath: string
    onNavigate: (path: string) => void
}

export default function FileManagerSidebar({ currentPath, onNavigate }: FileManagerSidebarProps) {
    const [folders, setFolders] = useState<(FolderAccess | string)[]>([])
    const [drives, setDrives] = useState<Drive[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchFolders(), fetchDrives()])
            setLoading(false)
        }
        fetchData()
    }, [])

    const fetchDrives = async () => {
        try {
            const res = await fetch('/api/drives')
            if (res.ok) {
                const data = await res.json()
                setDrives(data)
            }
        } catch (error) {
            console.error('Failed to fetch drives:', error)
        }
    }

    const fetchFolders = async () => {
        try {
            // First get user's accessible folders
            const userRes = await fetch('/api/folders')
            const userFolders = userRes.ok ? await userRes.json() : []

            // Then get all registered folders from config
            const configRes = await fetch('/api/folders/config')
            const allFolders = configRes.ok ? await configRes.json() : []

            // Filter to only show folders user has access to
            const userPaths = userFolders.map((f: any) => typeof f === 'string' ? f : f.path)
            const accessibleFolders = allFolders.filter((f: any) =>
                userPaths.some((userPath: string) =>
                    f.path === userPath || f.path.startsWith(userPath + '/')
                )
            )

            // Merge with user folders to ensure all are included
            const mergedFolders = [...userFolders]
            accessibleFolders.forEach((configFolder: any) => {
                if (!mergedFolders.some((f: any) => {
                    const path = typeof f === 'string' ? f : f.path
                    return path === configFolder.path
                })) {
                    mergedFolders.push(configFolder)
                }
            })

            setFolders(mergedFolders)
        } catch (error) {
            console.error('Failed to fetch folders:', error)
        } finally {
            // Loading is handled by Promise.all in useEffect
        }
    }

    if (loading) {
        return (
            <div className="w-64 bg-white border-r border-gray-200 p-4">
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">File Explorer</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Quick Access Section */}
                <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Quick Access
                    </div>
                    <div className="space-y-1 mt-1">
                        {folders
                            .filter(folder => {
                                const folderPath = typeof folder === 'string' ? folder : folder.path
                                const isDisk = typeof folder === 'string' ? false : folder.isDisk
                                // Show non-disk folders in Quick Access
                                return !isDisk
                            })
                            .map((folder) => {
                                const folderPath = typeof folder === 'string' ? folder : folder.path
                                const folderName = typeof folder === 'string' ? undefined : folder.name
                                const isDisk = typeof folder === 'string' ? false : folder.isDisk
                                const iconType = typeof folder === 'string' ? undefined : folder.icon

                                const isActive = currentPath === folderPath
                                const iconConfig = getFolderIcon(iconType, isDisk)
                                const Icon = iconConfig.icon
                                const displayName = folderName || folderPath?.split('/').filter(Boolean).pop() || folderPath || 'Unknown'

                                return (
                                    <button
                                        key={folderPath}
                                        onClick={() => onNavigate(folderPath)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                                        <span className="flex-1 text-left text-sm font-medium truncate">
                                            {displayName}
                                        </span>
                                        {isActive && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                )
                            })}
                    </div>
                </div>

                {/* Drives Section */}
                {drives.length > 0 && (
                    <div className="p-2 mt-2 border-t border-gray-200">
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Drives
                        </div>
                        <div className="space-y-1 mt-1">
                            {drives.map((drive) => {
                                const isActive = currentPath === drive.path
                                const Icon = drive.isRemovable ? Usb : HardDrive

                                return (
                                    <button
                                        key={drive.path}
                                        onClick={() => onNavigate(drive.path)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${drive.isRemovable ? 'text-orange-500' : 'text-gray-500'}`} />
                                        <span className="flex-1 text-left text-sm font-medium truncate">
                                            {drive.name || 'Local Drive'}
                                        </span>
                                        {isActive && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* This PC Section (legacy internal disks if any) */}
                {folders.some(f => {
                    const isDisk = typeof f === 'string' ? false : f.isDisk
                    return isDisk
                }) && (
                        <div className="p-2 mt-2 border-t border-gray-200">
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                This PC
                            </div>
                            <div className="space-y-1 mt-1">
                                {folders
                                    .filter(folder => {
                                        const isDisk = typeof folder === 'string' ? false : folder.isDisk
                                        return isDisk
                                    })
                                    .map((folder) => {
                                        const folderPath = typeof folder === 'string' ? folder : folder.path
                                        const folderName = typeof folder === 'string' ? undefined : folder.name
                                        const isDisk = typeof folder === 'string' ? false : folder.isDisk
                                        const iconType = typeof folder === 'string' ? undefined : folder.icon

                                        const isActive = currentPath === folderPath
                                        const iconConfig = getFolderIcon(iconType, isDisk)
                                        const Icon = iconConfig.icon
                                        const displayName = folderName || folderPath?.split('/').filter(Boolean).pop() || folderPath || 'Unknown'

                                        return (
                                            <button
                                                key={folderPath}
                                                onClick={() => onNavigate(folderPath)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                                                    ? 'bg-primary-50 text-primary-600'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                                                <span className="flex-1 text-left text-sm font-medium truncate">
                                                    {displayName}
                                                </span>
                                                {isActive && <ChevronRight className="w-4 h-4" />}
                                            </button>
                                        )
                                    })}
                            </div>
                        </div>
                    )}
            </div>

            <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
                {folders.length} location{folders.length !== 1 ? 's' : ''} available
            </div>
        </div>
    )
}
