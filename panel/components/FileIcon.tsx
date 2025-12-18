"use client"

import React, { useState } from 'react'
import {
    FaFolder, FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint,
    FaFileCode, FaFileArchive, FaFileAudio, FaFileVideo, FaFileImage, FaFileAlt
} from 'react-icons/fa'
import {
    BsFiletypeExe, BsFiletypeJson, BsFiletypeXml, BsFiletypeHtml, BsFiletypeCss,
    BsFiletypeJs, BsFiletypeTsx, BsFiletypePhp, BsFiletypeSql, BsFiletypePy, BsFiletypeJava
} from 'react-icons/bs'
import { SiTypescript, SiJavascript, SiPython, SiPhp, SiHtml5, SiCss3, SiMysql } from 'react-icons/si'

interface FileIconProps {
    name: string
    isDir: boolean
    path: string // Full path or ID for fetching thumbnail
    siteId: number
    className?: string
}

export default function FileIcon({ name, isDir, path, siteId, className = "w-6 h-6" }: FileIconProps) {
    const [imageError, setImageError] = useState(false)

    if (isDir) {
        return <FaFolder className={`${className} text-yellow-400`} />
    }

    const ext = name.split('.').pop()?.toLowerCase() || ''

    // Image Thumbnail
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) && !imageError) {
        return (
            <img
                src={`/api/files?action=view&path=${encodeURIComponent(path)}`}
                alt={name}
                className={`${className} object-cover rounded`}
                onError={() => setImageError(true)}
                loading="lazy"
            />
        )
    }

    // Icon Mapping
    let Icon = FaFileAlt
    let color = "text-gray-500"

    switch (ext) {
        case 'pdf': Icon = FaFilePdf; color = "text-red-500"; break;
        case 'doc': case 'docx': Icon = FaFileWord; color = "text-blue-500"; break;
        case 'xls': case 'xlsx': Icon = FaFileExcel; color = "text-green-500"; break;
        case 'ppt': case 'pptx': Icon = FaFilePowerpoint; color = "text-orange-500"; break;
        case 'zip': case 'rar': case '7z': case 'tar': case 'gz': Icon = FaFileArchive; color = "text-yellow-600"; break;
        case 'mp3': case 'wav': case 'ogg': Icon = FaFileAudio; color = "text-purple-500"; break;
        case 'mp4': case 'avi': case 'mov': case 'mkv': Icon = FaFileVideo; color = "text-purple-600"; break;
        case 'exe': case 'msi': Icon = BsFiletypeExe; color = "text-gray-600"; break;

        // Code
        case 'html': case 'htm': Icon = SiHtml5; color = "text-orange-600"; break;
        case 'css': Icon = SiCss3; color = "text-blue-600"; break;
        case 'js': case 'jsx': Icon = SiJavascript; color = "text-yellow-400"; break;
        case 'ts': case 'tsx': Icon = BsFiletypeTsx; color = "text-blue-500"; break;
        case 'php': Icon = SiPhp; color = "text-indigo-500"; break;
        case 'py': Icon = SiPython; color = "text-blue-500"; break;
        case 'java': case 'jar': Icon = BsFiletypeJava; color = "text-red-600"; break;
        case 'sql': Icon = SiMysql; color = "text-blue-600"; break;
        case 'json': Icon = BsFiletypeJson; color = "text-yellow-600"; break;
        case 'xml': Icon = BsFiletypeXml; color = "text-orange-500"; break;

        // Images (fallback if thumbnail fails)
        case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': case 'svg':
            Icon = FaFileImage; color = "text-purple-500"; break;

        default: Icon = FaFile; color = "text-gray-400"; break;
    }

    return <Icon className={`${className} ${color}`} />
}
