"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'es'
type Theme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight'

interface SettingsContextType {
    language: Language
    theme: Theme
    setLanguage: (lang: Language) => void
    setTheme: (theme: Theme) => void
    t: (key: string) => string
}

const translations = {
    en: {
        'settings': 'Settings',
        'settings.subtitle': 'Manage users, folders, and appearance',
        'tabs.users': 'Users',
        'tabs.folders': 'Shared Folders',
        'tabs.profile': 'Profile',
        'tabs.wallpapers': 'Wallpapers',
        'tabs.appearance': 'Appearance',
        'appearance.language': 'Language',
        'appearance.theme': 'Theme / Tone',
        'appearance.theme.subtitle': 'Customize the look and feel of your desktop',
        'theme.default': 'Default (Purple)',
        'theme.ocean': 'Ocean (Blue)',
        'theme.forest': 'Forest (Green)',
        'theme.sunset': 'Sunset (Orange)',
        'theme.midnight': 'Midnight (Dark)',
        'save': 'Save',
        'cancel': 'Cancel',
        'apply': 'Apply',
        'loading': 'Loading...',
        'greeting.morning': 'Good Morning',
        'greeting.afternoon': 'Good Afternoon',
        'greeting.evening': 'Good Evening',
        'edit': 'Edit',
        'done': 'Done',
        'shortcuts.add': 'Add Shortcut',
        'shortcuts.edit': 'Edit Shortcut',
        'shortcuts.name': 'Name',
        'shortcuts.url': 'URL',
        'shortcuts.icon': 'Icon',
        'shortcuts.color': 'Color',
        'shortcuts.openInWindow': 'Open in window (instead of new tab)',
        'logout': 'Logout',
        'dashboard': 'Dashboard',
        // Add more as we discover them
    },
    es: {
        'settings': 'Configuración',
        'settings.subtitle': 'Administrar usuarios, carpetas y apariencia',
        'tabs.users': 'Usuarios',
        'tabs.folders': 'Carpetas Compartidas',
        'tabs.profile': 'Perfil',
        'tabs.wallpapers': 'Fondos',
        'tabs.appearance': 'Apariencia',
        'appearance.language': 'Idioma',
        'appearance.theme': 'Tema / Tono',
        'appearance.theme.subtitle': 'Personaliza la apariencia de tu escritorio',
        'theme.default': 'Predeterminado (Púrpura)',
        'theme.ocean': 'Océano (Azul)',
        'theme.forest': 'Bosque (Verde)',
        'theme.sunset': 'Atardecer (Naranja)',
        'theme.midnight': 'Medianoche (Oscuro)',
        'save': 'Guardar',
        'cancel': 'Cancelar',
        'apply': 'Aplicar',
        'loading': 'Cargando...',
        'greeting.morning': 'Buenos Días',
        'greeting.afternoon': 'Buenas Tardes',
        'greeting.evening': 'Buenas Noches',
        'edit': 'Editar',
        'done': 'Listo',
        'shortcuts.add': 'Agregar Acceso Directo',
        'shortcuts.edit': 'Editar Acceso Directo',
        'shortcuts.name': 'Nombre',
        'shortcuts.url': 'URL',
        'shortcuts.icon': 'Icono',
        'shortcuts.color': 'Color',
        'shortcuts.openInWindow': 'Abrir en una ventana (en lugar de nueva pestaña)',
        'logout': 'Cerrar Sesión',
        'dashboard': 'Escritorio',
    }
}

const themes: Record<Theme, string> = {
    default: `
        --primary-50: #f5f3ff;
        --primary-100: #ede9fe;
        --primary-200: #ddd6fe;
        --primary-300: #c4b5fd;
        --primary-400: #a78bfa;
        --primary-500: #8b5cf6;
        --primary-600: #7c3aed;
        --primary-700: #6d28d9;
        --primary-800: #5b21b6;
        --primary-900: #4c1d95;
        --accent-color: #8b5cf6;
    `,
    ocean: `
        --primary-50: #f0f9ff;
        --primary-100: #e0f2fe;
        --primary-200: #bae6fd;
        --primary-300: #7dd3fc;
        --primary-400: #38bdf8;
        --primary-500: #0ea5e9;
        --primary-600: #0284c7;
        --primary-700: #0369a1;
        --primary-800: #075985;
        --primary-900: #0c4a6e;
        --accent-color: #0ea5e9;
    `,
    forest: `
        --primary-50: #f0fdf4;
        --primary-100: #dcfce7;
        --primary-200: #bbf7d0;
        --primary-300: #86efac;
        --primary-400: #4ade80;
        --primary-500: #22c55e;
        --primary-600: #16a34a;
        --primary-700: #15803d;
        --primary-800: #166534;
        --primary-900: #14532d;
        --accent-color: #22c55e;
    `,
    sunset: `
        --primary-50: #fff7ed;
        --primary-100: #ffedd5;
        --primary-200: #fed7aa;
        --primary-300: #fdba74;
        --primary-400: #fb923c;
        --primary-500: #f97316;
        --primary-600: #ea580c;
        --primary-700: #c2410c;
        --primary-800: #9a3412;
        --primary-900: #7c2d12;
        --accent-color: #f97316;
    `,
    midnight: `
        --primary-50: #f8fafc;
        --primary-100: #f1f5f9;
        --primary-200: #e2e8f0;
        --primary-300: #cbd5e1;
        --primary-400: #94a3b8;
        --primary-500: #64748b;
        --primary-600: #475569;
        --primary-700: #334155;
        --primary-800: #1e293b;
        --primary-900: #0f172a;
        --accent-color: #64748b;
    `
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en')
    const [theme, setTheme] = useState<Theme>('default')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language
        const savedTheme = localStorage.getItem('theme') as Theme
        if (savedLang) setLanguage(savedLang)
        if (savedTheme) setTheme(savedTheme)
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem('language', language)
        localStorage.setItem('theme', theme)

        // Apply theme variables
        const root = document.documentElement
        const themeVars = themes[theme]
        // This is a bit hacky, but works for dynamic CSS vars injection
        // We'll strip the newlines and just inject it into style attribute or append a style tag
        // Actually, let's just set the style attribute on body or html
        root.style.cssText = themeVars
    }, [language, theme, mounted])

    const t = (key: string) => {
        return translations[language][key as keyof typeof translations['en']] || key
    }

    return (
        <SettingsContext.Provider value={{ language, theme, setLanguage, setTheme, t }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
