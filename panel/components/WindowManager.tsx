"use client"

import { useWindows, Window } from './WindowContext'
import { X, Minus, Maximize2 } from 'lucide-react'
import { motion, useDragControls } from 'framer-motion'
import { useRef } from 'react'

export default function WindowManager() {
    const { windows } = useWindows()
    const visibleWindows = windows.filter(w => !w.isMinimized)

    return (
        <>
            {visibleWindows.map(window => (
                <DraggableWindow key={window.id} window={window} />
            ))}
        </>
    )
}

function DraggableWindow({ window }: { window: Window }) {
    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition } = useWindows()
    const dragControls = useDragControls()
    const constraintsRef = useRef(null)

    return (
        <>
            {/* Drag constraints (invisible layer) */}
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-0 mt-8" style={{ top: '32px' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, x: window.x, y: window.y }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    width: window.isMaximized ? '100vw' : '80vw',
                    height: window.isMaximized ? 'calc(100vh - 32px)' : '80vh',
                    top: window.isMaximized ? '32px' : 0, // Using 0 because we rely on x/y for positioning
                    left: window.isMaximized ? 0 : 0,
                    x: window.isMaximized ? 0 : (window.x || 0),
                    y: window.isMaximized ? 0 : (window.y || 0),
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                drag={!window.isMaximized}
                dragControls={dragControls}
                dragListener={false} // Only drag via controls (title bar)
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={constraintsRef}
                onDragEnd={(e, info) => {
                    if (!window.isMaximized) {
                        const newX = (window.x || 0) + info.offset.x
                        const newY = (window.y || 0) + info.offset.y
                        updateWindowPosition(window.id, newX, newY)
                    }
                }}
                className="fixed bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-black/10"
                style={{
                    zIndex: window.zIndex,
                    maxWidth: window.isMaximized ? '100vw' : '1400px',
                    maxHeight: window.isMaximized ? 'calc(100vh - 32px)' : '900px',
                    boxShadow: window.isMaximized
                        ? 'none'
                        : `0 0 1px rgba(0,0,0,0.2), 
                           0 10px 40px -10px rgba(0,0,0,0.3), 
                           0 20px 80px -20px rgba(0,0,0,0.25),
                           inset 0 0 0 1px rgba(255,255,255,0.5)`,
                    x: window.x,
                    y: window.y
                }}
                onClick={() => focusWindow(window.id)}
            >
                {/* Window Title Bar with subtle bottom shadow for depth */}
                <div
                    onPointerDown={(e) => {
                        dragControls.start(e)
                        focusWindow(window.id) // Ensure focus on drag start
                    }}
                    className="h-12 border-b border-black/5 flex items-center justify-between px-4 select-none cursor-move shadow-[0_1px_rgba(0,0,0,0.02)]"
                >
                    {/* Traffic Lights */}
                    <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                closeWindow(window.id)
                            }}
                            className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 flex items-center justify-center group transition-colors shadow-inner"
                        >
                            <X className="w-2 h-2 text-black/40 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                minimizeWindow(window.id)
                            }}
                            className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FFBD2E]/80 flex items-center justify-center group transition-colors shadow-inner"
                        >
                            <Minus className="w-2 h-2 text-black/40 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                maximizeWindow(window.id)
                            }}
                            className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 flex items-center justify-center group transition-colors shadow-inner"
                        >
                            <Maximize2 className="w-2 h-2 text-black/40 opacity-0 group-hover:opacity-100" />
                        </button>
                    </div>

                    {/* Title */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 text-[13px] font-semibold text-gray-700/90 pointer-events-none tracking-tight">
                        {window.title}
                    </div>

                    <div className="w-20"></div>
                </div>

                {/* Window Content */}
                <div className="h-[calc(100%-48px)] overflow-auto bg-white/40">
                    {window.component}
                </div>
            </motion.div>
        </>
    )
}
