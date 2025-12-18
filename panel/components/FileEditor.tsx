"use client"

import React, { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Save, FileText } from 'lucide-react'

interface FileEditorProps {
    file: { name: string, path: string }
    siteId: number
    onSave?: () => void
}

export default function FileEditor({ file, siteId, onSave }: FileEditorProps) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (file) {
            loadFile()
        }
    }, [file])

    const loadFile = async () => {
        if (!file) return
        setLoading(true)
        try {
            const res = await fetch(`/api/files`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'read_file',
                    path: file.path
                })
            })
            const data = await res.json()
            setContent(data.content)
        } catch (err) {
            console.error("Failed to load file", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!file) return
        setSaving(true)
        try {
            const res = await fetch(`/api/files`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'write_file',
                    path: file.path,
                    content
                })
            })
            if (!res.ok) throw new Error()
            if (onSave) onSave()
            // Using a simple notification style instead of alert if possible, 
            // but for now keeping it simple as per project standard
            alert("Saved!")
        } catch (err) {
            alert("Failed to save")
        } finally {
            setSaving(false)
        }
    }

    if (!file) return null

    // Determine language from extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    let language = 'plaintext'
    const langMap: Record<string, string> = {
        php: 'php',
        js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
        css: 'css', scss: 'scss', less: 'less',
        html: 'html', htm: 'html',
        json: 'json',
        sql: 'sql',
        md: 'markdown', markdown: 'markdown',
        xml: 'xml', svg: 'xml',
        yaml: 'yaml', yml: 'yaml',
        py: 'python',
        java: 'java',
        c: 'c', cpp: 'cpp',
        go: 'go',
        rs: 'rust',
        ini: 'ini', env: 'ini', conf: 'ini',
        sh: 'shell', bash: 'shell'
    }
    if (ext && langMap[ext]) language = langMap[ext]

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/80 backdrop-blur-sm select-none">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{language.toUpperCase()}</span>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    <Save className="w-3 h-3" />
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <Editor
                        height="100%"
                        defaultLanguage={language}
                        value={content}
                        onChange={(value) => setContent(value || '')}
                        theme="vs-light"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            padding: { top: 10 },
                            scrollBeyondLastLine: false,
                        }}
                    />
                )}
            </div>
        </div>
    )
}
