"use client"

import React, { useRef, useEffect, useState } from 'react'
import { FileMusic, FileVideo } from 'lucide-react'

interface MediaPlayerProps {
    file: { name: string, path: string }
    siteId: number
    type: 'audio' | 'video'
}

export default function MediaPlayer({ file, siteId, type }: MediaPlayerProps) {
    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    useEffect(() => {
        if (mediaRef.current) {
            mediaRef.current.load()
            setIsPlaying(false)
        }
    }, [file])

    if (!file) return null

    const mediaUrl = `/api/files?action=view&path=${encodeURIComponent(file.path)}`

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center min-h-0 relative">
                {type === 'video' ? (
                    <video
                        ref={mediaRef as React.RefObject<HTMLVideoElement>}
                        controls
                        autoPlay
                        className="w-full h-full object-contain bg-black"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={(e) => {
                            console.error('Video error:', e)
                        }}
                    >
                        <source src={mediaUrl} />
                        Tu navegador no soporta la reproducción de video.
                    </video>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 w-full max-w-lg">
                        {/* Album Art Style Visualizer */}
                        <div className="w-64 h-64 mb-12 relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden group">
                            {/* Animated Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-50'}`} />

                            {/* Rotating Ring (Vinyl effect) */}
                            {isPlaying && (
                                <div className="absolute inset-0 rounded-full border-4 border-white/5 animate-spin-slow" style={{ animationDuration: '3s' }} />
                            )}

                            {/* Music Icon */}
                            <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-110">
                                <FileMusic
                                    className={`w-32 h-32 text-white/90 drop-shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}
                                    strokeWidth={1}
                                />
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute top-4 right-4 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl" />
                            <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl" />
                        </div>

                        {/* Song Info (Optional, using filename for now) */}
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-medium text-white/90 truncate max-w-sm mx-auto">{file.name}</h3>
                        </div>

                        {/* Audio Player */}
                        <audio
                            ref={mediaRef as React.RefObject<HTMLAudioElement>}
                            controls
                            autoPlay
                            className="w-full shadow-lg rounded-full" // Basic styling, browser native controls mostly dictate this
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onError={(e) => {
                                console.error('Audio error:', e)
                            }}
                        >
                            <source src={mediaUrl} />
                            Tu navegador no soporta la reproducción de audio.
                        </audio>
                    </div>
                )}
            </div>

            {/* Footer / Status Bar - Optional but nice for context inside the window */}
            <div className="h-8 bg-gray-900/50 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-4 text-xs text-gray-400 select-none">
                <span>
                    {type === 'audio' ? 'Audio Player' : 'Video Player'}
                </span>
                <span className="opacity-50">
                    {mediaUrl.split('/').pop()}
                </span>
            </div>
        </div>
    )
}
