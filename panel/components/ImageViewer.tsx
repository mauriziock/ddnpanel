"use client"

import React from 'react'

interface ImageViewerProps {
    file: { name: string, path: string }
    siteId: number
}

export default function ImageViewer({ file, siteId }: ImageViewerProps) {
    if (!file) return null

    const imageUrl = `/api/files?action=view&path=${encodeURIComponent(file.path)}`

    return (
        <div className="flex flex-col h-full bg-gray-950/20 items-center justify-center p-4">
            <div className="relative max-w-full max-h-full flex items-center justify-center">
                <img
                    src={imageUrl}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded shadow-2xl transition-transform hover:scale-[1.01]"
                />
            </div>
            <div className="mt-4 px-4 py-1.5 bg-black/40 backdrop-blur-md text-white/90 rounded-full text-xs font-medium border border-white/10">
                {file.name}
            </div>
        </div>
    )
}
