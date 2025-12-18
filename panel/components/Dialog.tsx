"use client"

import React from 'react'

interface DialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    type?: 'info' | 'error' | 'warning' | 'success'
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    showCancel?: boolean
}

export default function Dialog({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancelar',
    onConfirm,
    showCancel = false
}: DialogProps) {
    if (!isOpen) return null

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        }
        onClose()
    }

    const getTypeStyles = () => {
        switch (type) {
            case 'error':
                return {
                    icon: (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ),
                    gradient: 'from-red-50 to-white'
                }
            case 'warning':
                return {
                    icon: (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    ),
                    gradient: 'from-amber-50 to-white'
                }
            case 'success':
                return {
                    icon: (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ),
                    gradient: 'from-green-50 to-white'
                }
            default:
                return {
                    icon: (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    ),
                    gradient: 'from-primary-50 to-white'
                }
        }
    }

    const styles = getTypeStyles()

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Content */}
                <div className={`p-8 bg-gradient-to-b ${styles.gradient}`}>
                    <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className="mb-5">
                            {styles.icon}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            {title}
                        </h3>

                        {/* Message */}
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 p-5 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200/50">
                    {showCancel && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-lg hover:bg-gray-50 hover:border-gray-400/50 transition-all duration-200 shadow-sm"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`${showCancel ? 'flex-1' : 'w-full'} px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]`}
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
