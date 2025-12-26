import { useState } from 'react'
import { User as UserIcon, Lock, Save, Image as ImageIcon, Upload, Edit2, Trash2, Plus } from 'lucide-react'
import { type User } from '@/lib/users'
import { type Wallpaper, DEFAULT_WALLPAPERS } from '@/lib/wallpapers'
import { useSettings } from './SettingsContext'

interface UserProfileProps {
    user: any
    allWallpapers: Wallpaper[]
    selectedWallpaper: string
    handleSetWallpaper: (url: string) => Promise<void>
    handleUploadWallpaper: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    handleDeleteWallpaper: (id: string) => Promise<void>
    uploadingWallpaper: boolean
}

export default function UserProfile({
    user,
    allWallpapers,
    selectedWallpaper,
    handleSetWallpaper,
    handleUploadWallpaper,
    handleDeleteWallpaper,
    uploadingWallpaper
}: UserProfileProps) {
    const { t, language, setLanguage, theme, setTheme } = useSettings()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [editMode, setEditMode] = useState(false)

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match')
            return
        }

        if (newPassword.length < 4) {
            alert('Password must be at least 4 characters')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    password: newPassword
                })
            })

            if (res.ok) {
                alert('Password changed successfully!')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to change password')
            }
        } catch (error) {
            alert('Error changing password')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('tabs.profile')}</h2>
                <p className="text-gray-600 mt-1">Manage your account and personal preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Account Info & Password */}
                <div className="lg:col-span-1 space-y-6">
                    {/* User Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-full flex items-center justify-center text-white">
                                <UserIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{user?.username}</h3>
                                <p className="text-sm text-gray-500 capitalize px-2 py-0.5 bg-gray-100 rounded-full inline-block mt-1 font-medium">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Language Selector */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-900">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            <h3 className="font-bold">{t('appearance.language')}</h3>
                        </div>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none font-medium"
                        >
                            <option value="en">English (US)</option>
                            <option value="es">Español</option>
                        </select>
                    </div>

                    {/* Theme Selector */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-900">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <h3 className="font-bold">{t('appearance.theme')}</h3>
                        </div>
                        <div className="space-y-2">
                            {(['default', 'ocean', 'forest', 'sunset', 'midnight'] as const).map((tName) => (
                                <button
                                    key={tName}
                                    onClick={() => setTheme(tName)}
                                    className={`w-full flex items-center gap-3 p-3 border rounded-xl transition-all ${theme === tName
                                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-50 border shadow-sm flex items-center justify-center flex-shrink-0`}>
                                        <div className={`w-6 h-6 rounded-full`} style={{
                                            backgroundColor: tName === 'default' ? '#8b5cf6' :
                                                tName === 'ocean' ? '#0ea5e9' :
                                                    tName === 'forest' ? '#22c55e' :
                                                        tName === 'sunset' ? '#f97316' :
                                                            '#1e293b'
                                        }} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-gray-900">{t(`theme.${tName}`)}</div>
                                    </div>
                                    {theme === tName && (
                                        <div className="text-primary-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-6 text-gray-900">
                            <Lock className="w-5 h-5" />
                            <h3 className="font-bold">Security</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Confirm
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                                className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20 mt-2"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Wallpaper Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-gray-900">
                                <ImageIcon className="w-5 h-5" />
                                <h3 className="font-bold">Wallpaper</h3>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditMode(!editMode)}
                                    className={`p-2 rounded-lg transition-all ${editMode ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="Edit custom wallpapers"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>

                                <label className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all cursor-pointer shadow-lg shadow-primary-500/20 font-medium text-sm">
                                    <Upload className="w-4 h-4" />
                                    {uploadingWallpaper ? '...' : 'Upload'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadWallpaper}
                                        disabled={uploadingWallpaper}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {allWallpapers.map((wallpaper) => {
                                const isActive = selectedWallpaper === wallpaper.url
                                const isDefault = wallpaper.isDefault

                                return (
                                    <div
                                        key={wallpaper.id}
                                        className={`relative group aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${isActive
                                            ? 'border-primary-500 ring-4 ring-primary-500/10 shadow-lg'
                                            : 'border-transparent hover:border-primary-200'
                                            }`}
                                        onClick={() => !editMode && handleSetWallpaper(wallpaper.url)}
                                    >
                                        <img
                                            src={wallpaper.url}
                                            alt={wallpaper.name}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Active Indicator */}
                                        {isActive && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* System Label */}
                                        {isDefault && (
                                            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-[8px] uppercase font-black border border-white/10">
                                                System
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        {editMode && !isDefault && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteWallpaper(wallpaper.id)
                                                }}
                                                className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-6 h-6" />
                                            </button>
                                        )}

                                        {/* Hover Selection Mode */}
                                        {!editMode && !isActive && (
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-gray-900 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-xl">
                                                    Select
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Clickable Slots for Upload */}
                            {allWallpapers.length < 12 && Array.from({ length: 12 - allWallpapers.length }).map((_, i) => (
                                <label
                                    key={`empty-${i}`}
                                    className="aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer group"
                                >
                                    <Plus className="w-6 h-6 opacity-30 group-hover:opacity-100 group-hover:text-primary-500 transition-all" />
                                    <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all mt-2 uppercase tracking-tighter text-primary-600">
                                        Drop image
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadWallpaper}
                                        disabled={uploadingWallpaper}
                                        className="hidden"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
