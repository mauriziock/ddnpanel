"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for class merging
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface DashboardGridProps {
    children: React.ReactNode
}

export default function DashboardGrid({ children }: DashboardGridProps) {
    return (
        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-7xl mx-auto align-top content-start">
            {children}
        </div>
    )
}

interface AppIconProps {
    name: string
    icon: React.ReactNode
    onClick?: () => void
    color?: string
    className?: string
}

export function AppIcon({ name, icon, onClick, color = "bg-blue-500", className }: AppIconProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className={cn("flex flex-col items-center justify-center p-4 cursor-pointer group", className)}
            onClick={onClick}
        >
            <div className={cn(
                "w-20 h-20 rounded-2xl shadow-xl flex items-center justify-center text-white text-4xl mb-3",
                "backdrop-blur-md bg-opacity-90 border border-white/20 transition-all duration-300",
                "group-hover:shadow-2xl group-hover:brightness-110",
                color
            )}>
                {icon}
            </div>
            <span className="text-white font-medium text-lg drop-shadow-md text-center select-none group-hover:text-blue-100 transition-colors">
                {name}
            </span>
        </motion.div>
    )
}
