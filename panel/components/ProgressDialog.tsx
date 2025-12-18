"use client"

import React from 'react'

export interface Operation {
    id: string
    type: 'upload' | 'zip' | 'unzip' | 'move' | 'copy' | 'delete' | 'create_folder' | 'rename'
    name: string
    progress: number // 0-100
    status: 'pending' | 'processing' | 'done' | 'error'
    error?: string
}

interface ProgressDialogProps {
    operations: Operation[]
    onClose: (id: string) => void
    onClearCompleted: () => void
}

export default function ProgressDialog({ operations, onClose, onClearCompleted }: ProgressDialogProps) {
    if (operations.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[400px]">
            {/* Header */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-medium text-gray-700 text-sm">Operations</h3>
                <button
                    onClick={onClearCompleted}
                    className="text-xs text-primary-600 hover:text-primary-800"
                >
                    Clear Done
                </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-2 space-y-2">
                {operations.map(op => (
                    <div key={op.id} className="bg-white p-2 rounded border border-gray-100 shadow-sm text-sm">
                        <div className="flex justify-between items-start mb-1">
                            <div className="truncate font-medium text-gray-700 pr-2" title={op.name}>
                                {op.type === 'upload' ? 'Uploading' : op.type.charAt(0).toUpperCase() + op.type.slice(1)}: {op.name}
                            </div>
                            <button
                                onClick={() => onClose(op.id)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1 overflow-hidden">
                            <div
                                className={`h-1.5 rounded-full transition-all duration-300 
                                    ${op.status === 'error' ? 'bg-red-500' : 'bg-primary-500'}
                                    ${op.status === 'processing' ? 'animate-pulse' : ''}
                                `}
                                style={{ width: `${op.status === 'processing' ? 100 : op.progress}%` }}
                            />
                        </div>

                        {/* Status Text */}
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>
                                {op.status === 'pending' && 'Waiting...'}
                                {op.status === 'processing' && 'Processing...'}
                                {op.status === 'done' && 'Completed'}
                                {op.status === 'error' && (op.error || 'Failed')}
                            </span>
                            {op.type === 'upload' && op.status === 'processing' && (
                                <span>{Math.round(op.progress)}%</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
