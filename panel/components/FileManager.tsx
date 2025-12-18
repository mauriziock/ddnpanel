"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import FileEditor from './FileEditor'
import ContextMenu from './ContextMenu'
import ProgressDialog, { Operation } from './ProgressDialog'
import ImageViewer from './ImageViewer'
import DetailsSidebar from './DetailsSidebar'
import FileIcon from './FileIcon'
import FileManagerSidebar from './FileManagerSidebar'
import Dialog from './Dialog'
import MediaPlayer from './MediaPlayer'
import { useWindows } from './WindowContext'
import { PlayCircle, Music, Image as ImageIcon, FileText } from 'lucide-react'

interface FileData {
    id: string
    name: string
    isDir: boolean
    size?: number
    modDate?: string
    ext?: string
}

interface FileManagerProps {
    siteId: number
}

export default function FileManager({ siteId }: FileManagerProps) {
    const { openWindow } = useWindows()
    const [files, setFiles] = useState<FileData[]>([])
    const [currentPath, setCurrentPath] = useState('/public') // Will be updated on mount
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [userFolders, setUserFolders] = useState<string[]>([]) // Store user's allowed folders

    // Editor State (REMOVED - migrated)
    // const [editorOpen, setEditorOpen] = useState(false)
    // const [editingFile, setEditingFile] = useState<{ name: string, path: string } | null>(null)

    // Image Viewer State (REMOVED - migrated)
    // const [imageViewerOpen, setImageViewerOpen] = useState(false)
    // const [viewingImage, setViewingImage] = useState<{ name: string, path: string } | null>(null)

    // Media Player State (REMOVED - migrated to WindowManager)
    // const [mediaPlayerOpen, setMediaPlayerOpen] = useState(false)
    // const [playingMedia, setPlayingMedia] = useState<{ name: string, path: string, type: 'audio' | 'video' } | null>(null)

    // View & Sort State
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [sortConfig, setSortConfig] = useState<{ key: keyof FileData, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' })

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const lastSelectedId = useRef<string | null>(null)

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: FileData | null } | null>(null)

    // Clipboard State
    const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut', files: { path: string, name: string }[] } | null>(null)

    // Progress Dialog State
    const [operations, setOperations] = useState<Operation[]>([])

    // Create Folder Modal State
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')

    // Rename Modal State
    const [showRenameModal, setShowRenameModal] = useState(false)
    const [renamingFile, setRenamingFile] = useState<FileData | null>(null)
    const [renameValue, setRenameValue] = useState('')

    // Dialog State
    const [dialog, setDialog] = useState<{
        isOpen: boolean
        title: string
        message: string
        type: 'info' | 'error' | 'warning' | 'success'
        onConfirm?: () => void
        showCancel?: boolean
    }>({ isOpen: false, title: '', message: '', type: 'info' })

    const showDialog = (title: string, message: string, type: 'info' | 'error' | 'warning' | 'success' = 'info') => {
        setDialog({ isOpen: true, title, message, type })
    }

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setDialog({ isOpen: true, title, message, type: 'warning', onConfirm, showCancel: true })
    }

    // Helper to add operation
    const addOperation = (type: Operation['type'], name: string) => {
        const id = Math.random().toString(36).substr(2, 9)
        setOperations(prev => [...prev, {
            id, type, name, progress: 0, status: 'processing'
        }])
        return id
    }

    // Helper to update operation
    const updateOperation = (id: string, updates: Partial<Operation>) => {
        setOperations(prev => prev.map(op => op.id === id ? { ...op, ...updates } : op))
    }

    // Helper to remove operation
    const removeOperation = (id: string) => {
        setOperations(prev => prev.filter(op => op.id !== id))
    }

    const clearCompletedOperations = () => {
        setOperations(prev => prev.filter(op => op.status !== 'done' && op.status !== 'error'))
    }

    // Fetch user's folders on mount
    useEffect(() => {
        const fetchUserFolders = async () => {
            try {
                const res = await fetch('/api/folders')
                if (res.ok) {
                    const folders = await res.json()
                    const folderPaths = folders.map((f: any) => f.path)
                    setUserFolders(folderPaths)
                    // Set initial path to first folder (usually user's home)
                    if (folders.length > 0) {
                        setCurrentPath(folders[0].path)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user folders:', error)
            }
        }
        fetchUserFolders()
    }, [])

    useEffect(() => {
        if (currentPath) {
            fetchFiles(currentPath)
        }
    }, [currentPath])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            const selected = getSelectedFiles()

            // Delete - Delete selected files
            if (e.key === 'Delete' && selected.length > 0) {
                e.preventDefault()
                if (selected.length === 1) {
                    handleDelete(selected[0])
                } else {
                    handleBulkDelete()
                }
            }

            // F2 - Rename (only if single file selected)
            if (e.key === 'F2' && selected.length === 1) {
                e.preventDefault()
                handleRename(selected[0])
            }

            // Ctrl+A - Select all
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault()
                const allIds = new Set(files.map(f => f.id))
                setSelectedIds(allIds)
            }

            // Ctrl+C - Copy
            if (e.ctrlKey && e.key === 'c' && selected.length > 0) {
                e.preventDefault()
                handleCopy()
            }

            // Ctrl+X - Cut
            if (e.ctrlKey && e.key === 'x' && selected.length > 0) {
                e.preventDefault()
                handleCut()
            }

            // Ctrl+V - Paste
            if (e.ctrlKey && e.key === 'v' && clipboard) {
                e.preventDefault()
                handlePaste()
            }

            // Escape - Deselect all
            if (e.key === 'Escape') {
                setSelectedIds(new Set())
                setContextMenu(null)
            }

            // Backspace - Go up one level
            if (e.key === 'Backspace' && currentPath !== '/') {
                e.preventDefault()
                handleUp()
            }

            // Enter - Open selected file/folder (only if single selection)
            if (e.key === 'Enter' && selected.length === 1) {
                e.preventDefault()
                handleOpen(selected[0])
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [files, selectedIds, clipboard, currentPath])

    const fetchFiles = async (path: string) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
            if (!res.ok) throw new Error('Failed to fetch files')
            const data = await res.json()

            // Client-side sorting
            const sorted = sortFiles(data, sortConfig)

            setFiles(sorted)
            setSelectedIds(new Set()) // Clear selection on navigate
        } catch (err) {
            setError('Failed to load files')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const sortFiles = (filesToSort: FileData[], config: { key: keyof FileData, direction: 'asc' | 'desc' }) => {
        return [...filesToSort].sort((a, b) => {
            // Always directories first
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1

            let valA = a[config.key]
            let valB = b[config.key]

            // Handle undefined/null
            if (valA === undefined) valA = ''
            if (valB === undefined) valB = ''

            if (typeof valA === 'string' && typeof valB === 'string') {
                return config.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return config.direction === 'asc' ? valA - valB : valB - valA
            }
            // For dates, convert to timestamp for comparison
            if (config.key === 'modDate' && typeof valA === 'string' && typeof valB === 'string') {
                const dateA = new Date(valA).getTime()
                const dateB = new Date(valB).getTime()
                return config.direction === 'asc' ? dateA - dateB : dateB - dateA
            }
            return 0
        })
    }

    const handleSort = (key: keyof FileData) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
        setFiles(prev => sortFiles(prev, { key, direction }))
    }

    const handleNavigate = (path: string) => {
        setCurrentPath(path)
    }

    const handleSelection = (e: React.MouseEvent, file: FileData) => {
        e.stopPropagation()

        const newSelected = new Set(selectedIds)

        if (e.ctrlKey || e.metaKey) {
            // Toggle
            if (newSelected.has(file.id)) {
                newSelected.delete(file.id)
            } else {
                newSelected.add(file.id)
                lastSelectedId.current = file.id
            }
        } else if (e.shiftKey && lastSelectedId.current) {
            // Range
            const lastIdx = files.findIndex(f => f.id === lastSelectedId.current)
            const currIdx = files.findIndex(f => f.id === file.id)
            if (lastIdx !== -1 && currIdx !== -1) {
                const start = Math.min(lastIdx, currIdx)
                const end = Math.max(lastIdx, currIdx)
                // If ctrl was not held, usually shift clears others, but let's keep it simple: add range
                if (!e.ctrlKey) newSelected.clear()
                for (let i = start; i <= end; i++) {
                    newSelected.add(files[i].id)
                }
            }
        } else {
            // Single select
            newSelected.clear()
            newSelected.add(file.id)
            lastSelectedId.current = file.id
        }

        setSelectedIds(newSelected)
    }

    const handleBackgroundClick = () => {
        setSelectedIds(new Set())
    }

    const handleUp = () => {
        if (currentPath === '/') return
        const parts = currentPath.split('/').filter(Boolean)
        parts.pop()
        setCurrentPath('/' + parts.join('/'))
    }

    // --- Actions ---

    const handleCreateFolder = () => {
        setShowCreateFolderModal(true)
        setNewFolderName('')
    }

    const confirmCreateFolder = async () => {
        if (!newFolderName.trim()) return
        await performAction('create_folder', { path: currentPath, name: newFolderName.trim() })
        setShowCreateFolderModal(false)
        setNewFolderName('')
    }

    const handleRename = async (file: FileData) => {
        setRenamingFile(file)
        setRenameValue(file.name)
        setShowRenameModal(true)
    }

    const confirmRename = async () => {
        if (!renamingFile || !renameValue || renameValue === renamingFile.name) {
            setShowRenameModal(false)
            return
        }
        await performAction('rename', { path: renamingFile.id, name: renameValue })
        setShowRenameModal(false)
        setRenamingFile(null)
        setRenameValue('')
    }

    const handleDelete = async (file: FileData) => {
        showConfirm(
            'Delete File',
            `Are you sure you want to delete "${file.name}"?`,
            async () => {
                try {
                    const res = await fetch(`/api/files?path=${encodeURIComponent(file.id)}`, {
                        method: 'DELETE'
                    })
                    if (!res.ok) {
                        const errorText = await res.text()
                        throw new Error(errorText || 'Failed to delete')
                    }
                    fetchFiles(currentPath)
                } catch (err: any) {
                    showDialog('Error', err.message || "Error deleting file", 'error')
                }
            }
        )
    }

    const handleZip = async (file: FileData) => {
        await performAction('zip', { path: file.id })
    }

    const handleUnzip = async (file: FileData) => {
        await performAction('unzip', { path: file.id })
    }

    const handleEdit = (file: FileData) => {
        openWindow(
            `edit-${file.id}`,
            `Editing: ${file.name}`,
            <FileEditor file={{ name: file.name, path: file.id }} siteId={siteId} onSave={() => fetchFiles(currentPath)} />,
            <FileText className="w-6 h-6 text-primary-500" />
        )
    }

    const performAction = async (action: string, payload: any) => {
        const opType = action as Operation['type']
        const opName = payload.name || (payload.path ? payload.path.split('/').pop() : 'Operation')
        const opId = addOperation(opType, opName)

        try {
            const res = await fetch(`/api/files`, {
                method: 'POST',
                body: JSON.stringify({ action, ...payload })
            })
            if (!res.ok) throw new Error(`Failed to ${action}`)

            updateOperation(opId, { status: 'done', progress: 100 })
            fetchFiles(currentPath)

            // Auto remove after 3 seconds if successful
            setTimeout(() => removeOperation(opId), 3000)
        } catch (err) {
            updateOperation(opId, { status: 'error', error: 'Failed' })
            // alert(`Error performing ${action}`) // Dialog shows error now
        }
    }

    // --- Clipboard & Context Menu Actions ---

    const handleContextMenu = (e: React.MouseEvent, file: FileData | null) => {
        e.preventDefault()

        // If right-clicking an unselected item, select it (and clear others unless ctrl)
        if (file && !selectedIds.has(file.id)) {
            setSelectedIds(new Set([file.id]))
            lastSelectedId.current = file.id
        }

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            file
        })
    }

    const getSelectedFiles = () => {
        return files.filter(f => selectedIds.has(f.id))
    }

    const handleCopy = () => {
        const selected = getSelectedFiles()
        if (selected.length === 0) return
        setClipboard({
            action: 'copy',
            files: selected.map(f => ({ path: f.id, name: f.name }))
        })
    }

    const handleCut = () => {
        const selected = getSelectedFiles()
        if (selected.length === 0) return
        setClipboard({
            action: 'cut',
            files: selected.map(f => ({ path: f.id, name: f.name }))
        })
    }

    const handlePaste = async () => {
        if (!clipboard) return

        const action = clipboard.action === 'copy' ? 'copy' : 'move'

        for (const item of clipboard.files) {
            const destPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`

            // For bulk paste, we just loop.
            // Note: If pasting into same folder as source with same name, it might fail or overwrite.
            // Ideally we'd handle "Copy of..." but for now let's just try.

            await performAction(action, {
                path: item.path,
                destination: destPath
            })
        }

        if (clipboard.action === 'cut') {
            setClipboard(null)
        }
    }

    const handleBulkDelete = async () => {
        const selected = getSelectedFiles()
        if (selected.length === 0) return

        showConfirm(
            'Delete Items',
            `Are you sure you want to delete ${selected.length} item(s)?`,
            async () => {
                const errors: string[] = []

                for (const file of selected) {
                    try {
                        const res = await fetch(`/api/files?path=${encodeURIComponent(file.id)}`, {
                            method: 'DELETE'
                        })
                        if (!res.ok) {
                            const errorText = await res.text()
                            errors.push(`${file.name}: ${errorText}`)
                        }
                    } catch (err: any) {
                        errors.push(`${file.name}: ${err.message}`)
                    }
                }

                fetchFiles(currentPath)
                setSelectedIds(new Set())

                if (errors.length > 0) {
                    showDialog('Deletion Errors', `Some items could not be deleted:\n\n${errors.join('\n')}`, 'error')
                }
            }
        )
    }

    const handleBulkZip = async () => {
        const selected = getSelectedFiles()
        if (selected.length === 0) return

        if (selected.length === 1) {
            await performAction('zip', { path: selected[0].id })
        } else {
            // Bulk zip
            // We need to pass the directory containing the files (currentPath)
            // and the list of filenames (targets)
            const targets = selected.map(f => f.name)
            await performAction('zip', {
                path: currentPath,
                targets
            })
        }
    }

    const handleDownload = async (file: FileData) => {
        try {
            const url = `/api/files?action=download&path=${encodeURIComponent(file.id)}`

            // Check if the download URL is valid
            const response = await fetch(url, { method: 'HEAD' })

            if (!response.ok) {
                alert('Failed to download file. Please try again.')
                return
            }

            // Create a temporary link and click it
            const link = document.createElement('a')
            link.href = url
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Download error:', error)
            alert('Failed to download file. Please check your connection.')
        }
    }

    const handleOpen = (file: FileData) => {
        if (file.isDir) {
            handleNavigate(file.id)
            return
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || ''

        // Images
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            openWindow(
                `image-${file.id}`,
                file.name,
                <ImageViewer file={{ name: file.name, path: file.id }} siteId={siteId} />,
                <ImageIcon className="w-6 h-6 text-primary-500" />
            )
            return
        }

        // Videos
        if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
            openWindow(
                `video-${file.id}`,
                file.name,
                <MediaPlayer file={{ name: file.name, path: file.id }} siteId={siteId} type="video" />,
                <PlayCircle className="w-6 h-6 text-primary-500" />
            )
            return
        }

        // Audio
        if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(ext)) {
            openWindow(
                `audio-${file.id}`,
                file.name,
                <MediaPlayer file={{ name: file.name, path: file.id }} siteId={siteId} type="audio" />,
                <Music className="w-6 h-6 text-primary-500" />
            )
            return
        }

        // Supported Text Files
        const textExtensions = [
            'php', 'js', 'ts', 'css', 'html', 'json', 'sql',
            'md', 'txt', 'xml', 'yaml', 'yml', 'env', 'ini', 'conf', 'gitignore', 'htaccess'
        ]

        if (textExtensions.includes(ext)) {
            handleEdit(file)
            return
        }

        // Unsupported
        showDialog('Unsupported File Type', `File type .${ext} is not supported for viewing/editing. Please download it.`, 'info')
    }

    const getContextMenuOptions = () => {
        const file = contextMenu?.file
        const options = []
        const selectedCount = selectedIds.size

        if (file) {
            if (selectedCount <= 1) {
                // Single item actions
                options.push({ label: 'Open', action: () => handleOpen(file) })
                if (!file.isDir) {
                    options.push({ label: 'Download', action: () => handleDownload(file) })
                }
                options.push({ label: 'Rename', action: () => handleRename(file) })
                options.push({ label: 'Copy', action: handleCopy, separator: true })
                options.push({ label: 'Cut', action: handleCut })
                options.push({ label: 'Zip', action: handleBulkZip, separator: true })
                if (file.name.endsWith('.zip')) {
                    options.push({ label: 'Unzip', action: () => handleUnzip(file) })
                }
                options.push({ label: 'Delete', action: handleBulkDelete, danger: true, separator: true })
            } else {
                // Bulk actions
                options.push({ label: `Copy ${selectedCount} items`, action: handleCopy })
                options.push({ label: `Cut ${selectedCount} items`, action: handleCut })
                options.push({ label: `Zip ${selectedCount} items`, action: handleBulkZip, separator: true })
                options.push({ label: `Delete ${selectedCount} items`, action: handleBulkDelete, danger: true, separator: true })
            }
        } else {
            // Background context menu
            options.push({ label: 'New Folder', action: handleCreateFolder })
        }

        // Paste is available if clipboard has content
        if (clipboard) {
            options.push({
                label: `Paste ${clipboard.files.length} items`,
                action: handlePaste,
                separator: true
            })
        }

        return options
    }

    // --- Upload ---

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        for (const file of acceptedFiles) {
            const opId = addOperation('upload', file.name)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('path', currentPath)

            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100
                    updateOperation(opId, { progress })
                }
            }

            xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    updateOperation(opId, { status: 'done', progress: 100 })
                    fetchFiles(currentPath)
                    setTimeout(() => removeOperation(opId), 3000)
                } else if (xhr.status === 403) {
                    updateOperation(opId, { status: 'error', error: 'Storage quota exceeded!' })
                }
                else {
                    updateOperation(opId, { status: 'error', error: 'Upload failed' })
                }
            }

            xhr.onerror = () => {
                updateOperation(opId, { status: 'error', error: 'Network error' })
            }

            xhr.open('POST', `/api/files`)
            xhr.send(formData)
        }
    }, [currentPath, siteId, addOperation, updateOperation, fetchFiles, removeOperation])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true, // Disable click to open dialog on the main area, we want drag only or specific button
        noKeyboard: true
    })

    const formatSize = (bytes?: number) => {
        if (bytes === undefined) return '-'
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    return (
        <div className="flex h-[600px] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Sidebar */}
            <FileManagerSidebar
                currentPath={currentPath}
                onNavigate={(path) => {
                    setCurrentPath(path)
                    fetchFiles(path)
                }}
            />

            {/* Main Content */}
            <div
                {...getRootProps()}
                className="flex flex-col flex-1 relative"
                onContextMenu={(e) => handleContextMenu(e, null)}
            >
                <input {...getInputProps()} />

                {/* Drag Overlay */}
                {isDragActive && (
                    <div className="absolute inset-0 z-50 bg-primary-50/90 border-2 border-primary-500 border-dashed rounded-lg flex items-center justify-center">
                        <div className="text-xl font-medium text-primary-600">Drop files to upload</div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <button
                            onClick={handleUp}
                            disabled={currentPath === '/'}
                            className="p-2 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                        <div className="text-sm font-medium text-gray-700 truncate">
                            {currentPath}
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleCreateFolder}
                            className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                            New Folder
                        </button>
                        <label className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors flex items-center cursor-pointer">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Upload
                            <input type="file" className="hidden" multiple onChange={(e) => {
                                if (e.target.files) {
                                    const files = Array.from(e.target.files)
                                    onDrop(files)
                                }
                            }} />
                        </label>
                        <div className="border-l border-gray-300 h-6 mx-2"></div>
                        <div className="flex bg-gray-200 rounded p-0.5">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="List View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Grid View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* File List / Grid */}
                    <div
                        className="flex-1 overflow-auto p-2"
                        onClick={handleBackgroundClick}
                    >
                        {loading ? (
                            <div className="flex justify-center items-center h-full text-gray-400">Loading...</div>
                        ) : error ? (
                            <div className="flex justify-center items-center h-full text-red-500">{error}</div>
                        ) : files.length === 0 ? (
                            <div className="flex justify-center items-center h-full text-gray-400">Empty directory</div>
                        ) : (
                            <>
                                {viewMode === 'list' ? (
                                    <div className="min-w-full inline-block align-middle">
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                                            Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('modDate')}>
                                                            Date Modified {sortConfig.key === 'modDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ext')}>
                                                            Type {sortConfig.key === 'ext' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('size')}>
                                                            Size {sortConfig.key === 'size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {files.map((file) => (
                                                        <tr
                                                            key={file.id}
                                                            className={`hover:bg-blue-50 cursor-pointer select-none
                                                            ${selectedIds.has(file.id) ? 'bg-blue-100' : ''}
                                                            ${clipboard?.action === 'cut' && clipboard.files.some(f => f.path === file.id) ? 'opacity-50' : ''}
                                                        `}
                                                            onClick={(e) => handleSelection(e, file)}
                                                            onContextMenu={(e) => {
                                                                e.stopPropagation()
                                                                handleContextMenu(e, file)
                                                            }}
                                                            onDoubleClick={() => handleOpen(file)}
                                                        >
                                                            <td className="px-6 py-2 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-6 w-6 mr-3">
                                                                        <FileIcon name={file.name} isDir={file.isDir} path={file.id} siteId={siteId} />
                                                                    </div>
                                                                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                {file.modDate ? new Date(file.modDate).toLocaleString() : '-'}
                                                            </td>
                                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                {file.isDir ? 'Folder' : (file.ext?.toUpperCase().replace('.', '') || 'File')}
                                                            </td>
                                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                                                {file.isDir ? '-' : formatSize(file.size)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {files.map((file) => (
                                            <div
                                                key={file.id}
                                                className={`flex flex-col items-center p-4 rounded-lg group transition-colors cursor-pointer select-none border border-transparent
                                                ${selectedIds.has(file.id) ? 'bg-blue-100 border-blue-300' : 'hover:bg-blue-50'}
                                                ${clipboard?.action === 'cut' && clipboard.files.some(f => f.path === file.id) ? 'opacity-50' : ''}
                                            `}
                                                onClick={(e) => handleSelection(e, file)}
                                                onContextMenu={(e) => {
                                                    e.stopPropagation()
                                                    handleContextMenu(e, file)
                                                }}
                                                onDoubleClick={() => handleOpen(file)}
                                            >
                                                <div className="w-16 h-16 mb-2 flex items-center justify-center">
                                                    <FileIcon name={file.name} isDir={file.isDir} path={file.id} siteId={siteId} className="w-16 h-16" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 text-center break-words w-full line-clamp-2">
                                                    {file.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Details Sidebar (Grid View Only) */}
                    {viewMode === 'grid' && selectedIds.size > 0 && (
                        <DetailsSidebar selectedFiles={getSelectedFiles()} siteId={siteId} />
                    )}
                </div>





                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        options={getContextMenuOptions()}
                    />
                )}

                <ProgressDialog
                    operations={operations}
                    onClose={removeOperation}
                    onClearCompleted={clearCompletedOperations}
                />

                {showCreateFolderModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-96 border border-white/20 animate-in zoom-in-95 duration-300">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Folder</h3>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmCreateFolder()
                                    if (e.key === 'Escape') setShowCreateFolderModal(false)
                                }}
                                placeholder="Folder name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowCreateFolderModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-white/80 border border-gray-300/50 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCreateFolder}
                                    disabled={!newFolderName.trim()}
                                    className="px-4 py-2 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rename Modal */}
                {showRenameModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-96 border border-white/20 animate-in zoom-in-95 duration-300">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Rename {renamingFile?.isDir ? 'Folder' : 'File'}</h3>
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmRename()
                                    if (e.key === 'Escape') setShowRenameModal(false)
                                }}
                                placeholder="New name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowRenameModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-white/80 border border-gray-300/50 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRename}
                                    disabled={!renameValue.trim()}
                                    className="px-4 py-2 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    Rename
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Dialog
                    isOpen={dialog.isOpen}
                    onClose={() => setDialog({ ...dialog, isOpen: false })}
                    title={dialog.title}
                    message={dialog.message}
                    type={dialog.type}
                    onConfirm={dialog.onConfirm}
                    showCancel={dialog.showCancel}
                />

            </div>
        </div>
    )
}
