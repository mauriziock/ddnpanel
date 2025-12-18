"use client"

import { useEffect, useRef } from 'react'

export default function DarkVeilBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // Particle system for the veil effect
        class Particle {
            x: number
            y: number
            size: number
            speedX: number
            speedY: number
            opacity: number

            constructor() {
                this.x = Math.random() * canvas.width
                this.y = Math.random() * canvas.height
                this.size = Math.random() * 300 + 100
                this.speedX = Math.random() * 0.5 - 0.25
                this.speedY = Math.random() * 0.5 - 0.25
                this.opacity = Math.random() * 0.15 + 0.05
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY

                if (this.x > canvas.width) this.x = 0
                if (this.x < 0) this.x = canvas.width
                if (this.y > canvas.height) this.y = 0
                if (this.y < 0) this.y = canvas.height
            }

            draw() {
                if (!ctx) return
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size
                )
                gradient.addColorStop(0, `rgba(100, 50, 150, ${this.opacity})`)
                gradient.addColorStop(0.5, `rgba(50, 20, 80, ${this.opacity * 0.5})`)
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

                ctx.fillStyle = gradient
                ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2)
            }
        }

        // Create particles
        const particles: Particle[] = []
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle())
        }

        // Animation loop
        let animationId: number
        const animate = () => {
            // Dark gradient background
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            bgGradient.addColorStop(0, '#0a0a0f')
            bgGradient.addColorStop(1, '#1a0a2e')
            ctx.fillStyle = bgGradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Update and draw particles
            particles.forEach(particle => {
                particle.update()
                particle.draw()
            })

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animationId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full -z-10"
            style={{ background: 'linear-gradient(to bottom, #0a0a0f, #1a0a2e)' }}
        />
    )
}
