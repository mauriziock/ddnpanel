"use client"

import React from 'react'
import FileIcon from './FileIcon'

interface FileData {
    id: string
    name: string
    isDir: boolean
    size?: number
    modDate?: string
    ext?: string
}

interface DetailsSidebarProps {
    selectedFiles: FileData[]
    siteId: number
}

export default function DetailsSidebar({ selectedFiles, siteId }: DetailsSidebarProps) {
    if (selectedFiles.length === 0) return null

    const formatSize = (bytes?: number) => {
        if (bytes === undefined) return '-'
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString()
    }

    // Single Item
    if (selectedFiles.length === 1) {
        const file = selectedFiles[0]
        return (
            <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 flex flex-col h-full overflow-y-auto">
                <div className="flex justify-center mb-4">
                    <FileIcon name={file.name} isDir={file.isDir} path={file.id} siteId={siteId} className="w-20 h-20" />
                </div>

                <h3 className="font-semibold text-gray-800 text-center break-words mb-6">{file.name}</h3>

                <div className="space-y-4 text-sm">
                    <div>
                        <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Type</div>
                        <div className="text-gray-700">{file.isDir ? 'Folder' : (file.ext?.toUpperCase().replace('.', '') || 'File')}</div>
                    </div>

                    {!file.isDir && (
                        <div>
                            <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Size</div>
                            <div className="text-gray-700">{formatSize(file.size)}</div>
                        </div>
                    )}

                    <div>
                        <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Modified</div>
                        <div className="text-gray-700">{formatDate(file.modDate)}</div>
                    </div>

                    <div>
                        <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Path</div>
                        <div className="text-gray-700 break-all font-mono text-xs">{file.id}</div>
                    </div>
                </div>
            </div>
        )
    }

    // Multiple Items
    const totalSize = selectedFiles.reduce((acc, file) => acc + (file.size || 0), 0)

    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 flex flex-col h-full">
            <div className="flex justify-center mb-6 space-x-[-10px]">
                <div className="w-16 h-16 bg-gray-200 rounded border-2 border-white shadow-sm flex items-center justify-center z-10">
                    <span className="text-2xl font-bold text-gray-400">{selectedFiles.length}</span>
                </div>
                <div className="w-16 h-16 bg-gray-300 rounded border-2 border-white shadow-sm z-0 transform translate-y-2"></div>
            </div>

            <h3 className="font-semibold text-gray-800 text-center mb-6">{selectedFiles.length} items selected</h3>

            <div className="space-y-4 text-sm">
                <div>
                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Total Size</div>
                    <div className="text-gray-700">{formatSize(totalSize)}</div>
                </div>
            </div>
        </div>
    )
}
