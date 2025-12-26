"use client"

import DashboardGrid, { AppIcon } from "@/components/Dashboard/Grid"
import { FolderOpen, Settings, Edit3, Plus, X, Edit2, Search } from "lucide-react"
import { useWindows } from "@/components/WindowContext"
import FileManager from "@/components/FileManager"
import SettingsClient from "@/app/settings/SettingsClient"
import SystemWidgets from "@/components/SystemWidgets"
import IframeViewer from "@/components/IframeViewer"
import { popularApps, AppIcon as SimpleIcon, searchIcons, getIconBySlug } from "@/lib/appIcons"
import { useEffect, useState } from "react"
import { useSettings } from "@/components/SettingsContext"
import { useRouter } from "next/navigation"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Shortcut {
    id: string
    name: string
    url: string
    icon: string
    iconType?: 'emoji' | 'svg'
    iconSlug?: string
    color: string
    openInWindow?: boolean
}

interface SortableShortcutProps {
    shortcut: Shortcut
    editMode: boolean
    onDelete: (id: string) => void
    onEdit: (shortcut: Shortcut) => void
    onClick: (shortcut: Shortcut) => void
}

function SortableShortcut({ shortcut, editMode, onDelete, onEdit, onClick }: SortableShortcutProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: shortcut.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!editMode) {
            e.stopPropagation()
            onClick(shortcut)
        }
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="relative group">
            <div
                {...(editMode ? listeners : {})}
                onClick={handleClick}
                className={editMode ? 'cursor-move' : 'cursor-pointer'}
            >
                <AppIcon
                    name={shortcut.name}
                    icon={
                        shortcut.iconType === 'svg' && shortcut.iconSlug ? (
                            <div
                                className="w-10 h-10 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current"
                                dangerouslySetInnerHTML={{
                                    __html: getIconBySlug(shortcut.iconSlug)?.svg || ''
                                }}
                            />
                        ) : (
                            <span className="text-4xl">{shortcut.icon}</span>
                        )
                    }
                    color={shortcut.color}
                />
            </div>
            {editMode && (
                <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(shortcut)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(shortcut.id)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}

export default function DashboardClient({ user }: { user: any }) {
    const { t } = useSettings()
    const { openWindow } = useWindows()
    const router = useRouter()
    const [editMode, setEditMode] = useState(false)
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        icon: '🔗',
        iconType: 'emoji' as 'emoji' | 'svg',
        iconSlug: '',
        color: 'bg-gradient-to-br from-blue-500 to-purple-600',
        openInWindow: false
    })
    const [iconSearch, setIconSearch] = useState('')
    const [filteredIcons, setFilteredIcons] = useState<SimpleIcon[]>(popularApps)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Check if user session is valid
    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

    // Load shortcuts
    useEffect(() => {
        fetchShortcuts()
    }, [])

    const fetchShortcuts = async () => {
        try {
            const res = await fetch('/api/shortcuts')
            if (res.ok) {
                const data = await res.json()
                setShortcuts(data)
            }
        } catch (error) {
            console.error('Failed to fetch shortcuts:', error)
        }
    }

    const handleSaveShortcut = async () => {
        if (!formData.name || !formData.url) return

        try {
            if (editingShortcut) {
                // Update existing
                const res = await fetch('/api/shortcuts', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, id: editingShortcut.id })
                })
                if (res.ok) {
                    await fetchShortcuts()
                    closeModal()
                }
            } else {
                // Create new
                const res = await fetch('/api/shortcuts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                if (res.ok) {
                    await fetchShortcuts()
                    closeModal()
                }
            }
        } catch (error) {
            console.error('Failed to save shortcut:', error)
        }
    }

    const handleDeleteShortcut = async (id: string) => {
        try {
            const res = await fetch('/api/shortcuts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })

            if (res.ok) {
                await fetchShortcuts()
            }
        } catch (error) {
            console.error('Failed to delete shortcut:', error)
        }
    }

    const handleEditShortcut = (shortcut: Shortcut) => {
        setEditingShortcut(shortcut)
        setFormData({
            name: shortcut.name,
            url: shortcut.url,
            icon: shortcut.icon,
            iconType: shortcut.iconType || 'emoji',
            iconSlug: shortcut.iconSlug || '',
            color: shortcut.color,
            openInWindow: shortcut.openInWindow || false
        })
        setShowModal(true)
    }

    const openAddModal = () => {
        setEditingShortcut(null)
        setFormData({ name: '', url: '', icon: '🔗', iconType: 'emoji', iconSlug: '', color: 'bg-gradient-to-br from-blue-500 to-purple-600', openInWindow: false })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingShortcut(null)
        setFormData({ name: '', url: '', icon: '🔗', iconType: 'emoji', iconSlug: '', color: 'bg-gradient-to-br from-blue-500 to-purple-600', openInWindow: false })
        setIconSearch('')
    }

    // Filter icons based on search
    useEffect(() => {
        if (iconSearch.trim() === '') {
            setFilteredIcons(popularApps)
        } else {
            const results = searchIcons(iconSearch)
            setFilteredIcons(results)
        }
    }, [iconSearch])

    const selectAppIcon = (app: SimpleIcon) => {
        setFormData({
            ...formData,
            icon: app.name,
            iconType: 'svg',
            iconSlug: app.slug
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = shortcuts.findIndex(s => s.id === active.id)
            const newIndex = shortcuts.findIndex(s => s.id === over.id)

            const newOrder = arrayMove(shortcuts, oldIndex, newIndex)
            setShortcuts(newOrder)

            // Save new order to backend
            try {
                await fetch('/api/shortcuts/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newOrder)
                })
            } catch (error) {
                console.error('Failed to save order:', error)
            }
        }
    }

    const handleShortcutClick = (shortcut: Shortcut) => {
        if (shortcut.openInWindow) {
            // Prepare icon for window
            const windowIcon = shortcut.iconType === 'svg' && shortcut.iconSlug ? (
                <div
                    className="w-6 h-6 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current"
                    dangerouslySetInnerHTML={{
                        __html: getIconBySlug(shortcut.iconSlug)?.svg || ''
                    }}
                />
            ) : (
                <span className="text-2xl">{shortcut.icon}</span>
            )

            // Open in window with icon
            openWindow(
                shortcut.id,
                shortcut.name,
                <IframeViewer url={shortcut.url} name={shortcut.name} />,
                windowIcon,
                shortcut.iconType,
                shortcut.iconSlug
            )
        } else {
            // Open in new tab
            window.open(shortcut.url, '_blank', 'noopener,noreferrer')
        }
    }

    const handleOpenFiles = () => {
        openWindow('files', 'Files', <FileManager siteId={1} />)
    }

    const handleOpenSettings = () => {
        openWindow('settings', 'Settings', <SettingsClient user={user} />)
    }

    const wallpaper = user?.wallpaper || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'



    const colorOptions = [
        'bg-gradient-to-br from-blue-500 to-cyan-500',
        'bg-gradient-to-br from-purple-600 to-purple-800',
        'bg-gradient-to-br from-pink-500 to-rose-600',
        'bg-gradient-to-br from-green-500 to-emerald-600',
        'bg-gradient-to-br from-orange-500 to-red-600',
        'bg-gradient-to-br from-yellow-500 to-orange-500',
        'bg-gradient-to-br from-indigo-500 to-blue-600',
        'bg-gradient-to-br from-gray-600 to-gray-800',
    ]

    return (
        <div
            className="min-h-screen bg-cover bg-center pt-7"
            style={{
                backgroundImage: `url("${wallpaper}")`,
                // @ts-ignore
                '--wallpaper-url': `url("${wallpaper}")`
            }}
        >
            <div className="min-h-screen bg-black/40 backdrop-blur-sm p-8">

                {/* Header */}
                <div className="flex justify-between items-center mb-12 max-w-7xl mx-auto">
                    <div className="text-white">
                        <h1 className="text-3xl font-bold drop-shadow-lg">
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return t('greeting.morning');
                                if (hour < 18) return t('greeting.afternoon');
                                return t('greeting.evening');
                            })()}, {user?.name || user?.username || 'User'}
                        </h1>
                        <p className="text-white/80 drop-shadow-md">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`px-4 py-2 rounded-lg backdrop-blur-md transition-all ${editMode
                                ? 'bg-primary-600/90 text-white shadow-lg'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                                }`}
                        >
                            <Edit3 className="w-5 h-5 inline mr-2" />
                            {editMode ? t('done') : t('edit')}
                        </button>
                        <SystemWidgets />
                    </div>
                </div>

                {/* Apps Grid */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={shortcuts.map(s => s.id)}
                        strategy={rectSortingStrategy}
                    >
                        <DashboardGrid>
                            <button onClick={handleOpenFiles}>
                                <AppIcon
                                    name="Files"
                                    icon={<FolderOpen className="w-10 h-10" />}
                                    color="bg-gradient-to-br from-blue-500 to-cyan-500"
                                />
                            </button>

                            <button onClick={handleOpenSettings}>
                                <AppIcon
                                    name="Settings"
                                    icon={<Settings className="w-10 h-10" />}
                                    color="bg-gradient-to-br from-purple-600 to-purple-800"
                                />
                            </button>

                            {/* Shortcuts */}
                            {shortcuts.map(shortcut => (
                                <SortableShortcut
                                    key={shortcut.id}
                                    shortcut={shortcut}
                                    editMode={editMode}
                                    onDelete={handleDeleteShortcut}
                                    onEdit={handleEditShortcut}
                                    onClick={handleShortcutClick}
                                />
                            ))}

                            {/* Add Button (only in edit mode) */}
                            {editMode && (
                                <button onClick={openAddModal}>
                                    <AppIcon
                                        name="Add App"
                                        icon={<Plus className="w-10 h-10" />}
                                        color="bg-white/10 border-2 border-dashed border-white/30"
                                    />
                                </button>
                            )}
                        </DashboardGrid>
                    </SortableContext>
                </DndContext>

                {/* Add/Edit Shortcut Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-96 border border-white/20 animate-in zoom-in-95 duration-300">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                {editingShortcut ? t('shortcuts.edit') : t('shortcuts.add')}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('shortcuts.name')}</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="My App"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('shortcuts.url')}</label>
                                    <input
                                        type="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        placeholder="https://example.com"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('shortcuts.icon')}</label>

                                    {/* Search */}
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                            placeholder="Search apps (portainer, jellyfin...)"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    </div>

                                    {/* Icon Grid */}
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                        <div className="grid grid-cols-6 gap-2">
                                            {filteredIcons.map((app) => (
                                                <button
                                                    key={app.slug}
                                                    type="button"
                                                    onClick={() => selectAppIcon(app)}
                                                    className={`p-2 rounded-lg hover:bg-primary-50 transition-colors ${formData.iconSlug === app.slug ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-50'
                                                        }`}
                                                    title={app.name}
                                                >
                                                    <div
                                                        className="w-8 h-8 mx-auto [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current text-gray-700"
                                                        dangerouslySetInnerHTML={{ __html: app.svg }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {filteredIcons.length === 0 && (
                                            <p className="text-center text-gray-500 text-sm py-4">No icons found</p>
                                        )}
                                    </div>

                                    {/* Selected Icon Preview */}
                                    {formData.iconType === 'svg' && formData.iconSlug && (
                                        <div className="mt-2 p-2 bg-primary-50 rounded-lg flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current text-primary-600"
                                                dangerouslySetInnerHTML={{
                                                    __html: getIconBySlug(formData.iconSlug)?.svg || ''
                                                }}
                                            />
                                            <span className="text-sm font-medium text-purple-900">{formData.icon}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('shortcuts.color')}</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`h-12 rounded-lg ${color} ${formData.color === color ? 'ring-4 ring-primary-500' : ''
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.openInWindow}
                                            onChange={(e) => setFormData({ ...formData, openInWindow: e.target.checked })}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                            {t('shortcuts.openInWindow')}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-white/80 border border-gray-300/50 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveShortcut}
                                    disabled={!formData.name || !formData.url}
                                    className="px-4 py-2 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {editingShortcut ? t('save') : t('apply')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
