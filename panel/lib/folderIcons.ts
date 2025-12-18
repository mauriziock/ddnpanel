import { Folder, Music, Image, FileText, Video, Download, HardDrive } from 'lucide-react'

export const folderIcons = {
    folder: { icon: Folder, label: 'Folder', color: 'text-blue-500' },
    music: { icon: Music, label: 'Music', color: 'text-purple-500' },
    pictures: { icon: Image, label: 'Pictures', color: 'text-pink-500' },
    documents: { icon: FileText, label: 'Documents', color: 'text-yellow-600' },
    videos: { icon: Video, label: 'Videos', color: 'text-red-500' },
    downloads: { icon: Download, label: 'Downloads', color: 'text-green-500' },
}

export function getFolderIcon(iconType?: string, isDisk?: boolean) {
    if (isDisk) {
        return { icon: HardDrive, color: 'text-gray-600' }
    }

    const iconConfig = iconType && folderIcons[iconType as keyof typeof folderIcons]
    return iconConfig || folderIcons.folder
}
