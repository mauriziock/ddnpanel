"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

export interface Window {
    id: string
    title: string
    component: ReactNode
    isMinimized: boolean
    isMaximized: boolean
    zIndex: number
    icon?: ReactNode
    iconType?: 'emoji' | 'svg'
    iconSlug?: string
    x?: number
    y?: number
}

interface WindowContextType {
    windows: Window[]
    openWindow: (id: string, title: string, component: ReactNode, icon?: ReactNode, iconType?: 'emoji' | 'svg', iconSlug?: string) => void
    closeWindow: (id: string) => void
    minimizeWindow: (id: string) => void
    maximizeWindow: (id: string) => void
    restoreWindow: (id: string) => void
    focusWindow: (id: string) => void
    updateWindowPosition: (id: string, x: number, y: number) => void
}

const WindowContext = createContext<WindowContextType | undefined>(undefined)

export function WindowProvider({ children }: { children: ReactNode }) {
    const [windows, setWindows] = useState<Window[]>([])
    const [nextZIndex, setNextZIndex] = useState(100)

    const openWindow = (id: string, title: string, component: ReactNode, icon?: ReactNode, iconType?: 'emoji' | 'svg', iconSlug?: string) => {
        // Check if window already exists
        const existing = windows.find(w => w.id === id)
        if (existing) {
            if (existing.isMinimized) {
                restoreWindow(id)
            } else {
                focusWindow(id)
            }
            return
        }

        // Calculate initial position (simple cascade)
        const offset = windows.length * 30
        const initialX = 100 + (offset % 200)
        const initialY = 100 + (offset % 200)

        const newWindow: Window = {
            id,
            title,
            component,
            isMinimized: false,
            isMaximized: false,
            zIndex: nextZIndex,
            icon,
            iconType,
            iconSlug,
            x: initialX,
            y: initialY
        }

        setWindows([...windows, newWindow])
        setNextZIndex(nextZIndex + 1)
    }

    const closeWindow = (id: string) => {
        setWindows(windows.filter(w => w.id !== id))
    }

    const minimizeWindow = (id: string) => {
        setWindows(windows.map(w =>
            w.id === id ? { ...w, isMinimized: true } : w
        ))
    }

    const maximizeWindow = (id: string) => {
        setWindows(windows.map(w =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
        ))
    }

    const restoreWindow = (id: string) => {
        setWindows(windows.map(w =>
            w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
        ))
        setNextZIndex(nextZIndex + 1)
    }

    const focusWindow = (id: string) => {
        setWindows(windows.map(w =>
            w.id === id ? { ...w, zIndex: nextZIndex } : w
        ))
        setNextZIndex(nextZIndex + 1)
    }

    const updateWindowPosition = (id: string, x: number, y: number) => {
        setWindows(windows.map(w =>
            w.id === id ? { ...w, x, y } : w
        ))
    }

    return (
        <WindowContext.Provider value={{
            windows,
            openWindow,
            closeWindow,
            minimizeWindow,
            maximizeWindow,
            restoreWindow,
            focusWindow,
            updateWindowPosition
        }}>
            {children}
        </WindowContext.Provider>
    )
}

export function useWindows() {
    const context = useContext(WindowContext)
    if (!context) {
        throw new Error('useWindows must be used within WindowProvider')
    }
    return context
}
