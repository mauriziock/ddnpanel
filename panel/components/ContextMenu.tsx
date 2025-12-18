"use client"

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ContextMenuProps {
    x: number
    y: number
    onClose: () => void
    options: {
        label: string
        action: () => void
        disabled?: boolean
        danger?: boolean
        separator?: boolean
    }[]
}

export default function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [pos, setPos] = useState({ top: y, left: x })

    useEffect(() => {
        setMounted(true)

        // Adjust position to keep within viewport after rendering
        const updatePosition = () => {
            if (menuRef.current) {
                const rect = menuRef.current.getBoundingClientRect()
                const screenWidth = window.innerWidth
                const screenHeight = window.innerHeight

                let finalX = x
                let finalY = y

                if (x + rect.width > screenWidth) {
                    finalX = screenWidth - rect.width - 5
                }
                if (y + rect.height > screenHeight) {
                    finalY = screenHeight - rect.height - 5
                }

                setPos({ top: finalY, left: finalX })
            }
        }

        const timeoutId = setTimeout(updatePosition, 0)
        return () => clearTimeout(timeoutId)
    }, [x, y])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    if (!mounted) return null

    const menuContent = (
        <div
            ref={menuRef}
            className="fixed z-[999999] bg-white/95 backdrop-blur-2xl rounded-2xl py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-150 border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_1px_rgba(0,0,0,0.2)]"
            style={{
                top: pos.top,
                left: pos.left,
            }}
        >
            <div className="px-1.5">
                {options.map((option, index) => (
                    <React.Fragment key={index}>
                        {option.separator && <div className="border-t border-black/5 my-1.5 mx-2" />}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!option.disabled) {
                                    option.action()
                                    onClose()
                                }
                            }}
                            disabled={option.disabled}
                            className={`w-full text-left px-3 py-1.5 text-[13px] flex items-center transition-all duration-200 rounded-lg group
                                ${option.disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-primary-600 hover:text-white cursor-pointer hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]'}
                                ${option.danger ? 'text-red-500 hover:bg-red-500 hover:text-white' : 'text-gray-700'}
                            `}
                        >
                            <span className="flex-1 truncate">{option.label}</span>
                        </button>
                    </React.Fragment>
                ))}
            </div>
        </div>
    )

    return createPortal(menuContent, document.body)
}
