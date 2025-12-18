"use client"

import { useWindows } from './WindowContext'
import AppLauncher, { DockItemData } from './AppLauncher'
import { FolderOpen, Settings } from 'lucide-react'
import { popularApps } from '@/lib/appIcons'
import { motion } from 'framer-motion'

export default function MinimizedWindowsBar() {
    const { windows, restoreWindow } = useWindows()

    const minimizedWindows = windows.filter(w => w.isMinimized)

    if (minimizedWindows.length === 0) return null

    const dockItems: DockItemData[] = minimizedWindows.map(window => {
        // Use window icon if available, otherwise determine based on title
        let icon: React.ReactNode

        if (window.icon) {
            // Use the icon passed when window was created
            icon = window.icon
        } else if (window.title === 'Files') {
            icon = <FolderOpen className="w-6 h-6" />
        } else if (window.title === 'Settings') {
            icon = <Settings className="w-6 h-6" />
        } else {
            // Default to first 2 letters
            icon = <span className="text-lg font-semibold">{window.title.substring(0, 2).toUpperCase()}</span>
        }

        return {
            icon,
            label: window.title,
            onClick: () => restoreWindow(window.id),
            className: ''
        }
    })

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[99999] hover:bottom-7 transition-all duration-300"
        >
            <AppLauncher
                items={dockItems}
                panelHeight={64}
                baseItemSize={52}
                magnification={70}
                distance={140}
            />
        </motion.div>
    )
}
