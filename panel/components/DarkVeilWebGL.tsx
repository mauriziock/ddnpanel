"use client"

import { useEffect, useRef } from 'react'

export default function DarkVeilWebGL() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        let cleanup: (() => void) | undefined

        const init = async () => {
            const { Renderer, Geometry, Program, Mesh } = await import('ogl')

            const renderer = new Renderer({ dpr: 2, alpha: false })
            const gl = renderer.gl
            containerRef.current?.appendChild(gl.canvas)

            gl.canvas.style.position = 'absolute'
            gl.canvas.style.top = '0'
            gl.canvas.style.left = '0'
            gl.canvas.style.width = '100%'
            gl.canvas.style.height = '100%'

            const geometry = new Geometry(gl, {
                position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
                uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
            })

            const program = new Program(gl, {
                vertex: `
                    attribute vec2 uv;
                    attribute vec2 position;
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = vec4(position, 0, 1);
                    }
                `,
                fragment: `
                    precision highp float;
                    
                    uniform float uTime;
                    uniform vec2 uResolution;
                    varying vec2 vUv;

                    // Simplex 2D noise
                    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

                    float snoise(vec2 v) {
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                         -0.577350269189626, 0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy) );
                        vec2 x0 = v -   i + dot(i, C.xx);
                        vec2 i1;
                        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec4 x12 = x0.xyxy + C.xxzz;
                        x12.xy -= i1;
                        i = mod(i, 289.0);
                        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                        + i.x + vec3(0.0, i1.x, 1.0 ));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                          dot(x12.zw,x12.zw)), 0.0);
                        m = m*m ;
                        m = m*m ;
                        vec3 x = 2.0 * fract(p * C.www) - 1.0;
                        vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5);
                        vec3 a0 = x - ox;
                        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                        vec3 g;
                        g.x  = a0.x  * x0.x  + h.x  * x0.y;
                        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                        return 130.0 * dot(m, g);
                    }

                    void main() {
                        vec2 uv = gl_FragCoord.xy / uResolution.xy;
                        vec2 p = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                        
                        float t = uTime * 0.05;
                        
                        // Multiple octaves of noise
                        float n = 0.0;
                        float amp = 1.0;
                        float freq = 1.0;
                        
                        for(int i = 0; i < 5; i++) {
                            n += amp * snoise(p * freq + vec2(t * 0.3, t * 0.2));
                            amp *= 0.5;
                            freq *= 2.0;
                        }
                        
                        // Smooth the noise
                        n = n * 0.5 + 0.5;
                        n = smoothstep(0.3, 0.7, n);
                        
                        // Dark purple/blue gradient
                        vec3 color1 = vec3(0.02, 0.01, 0.08);  // Very dark blue
                        vec3 color2 = vec3(0.08, 0.03, 0.15);  // Dark purple
                        vec3 color3 = vec3(0.12, 0.05, 0.20);  // Medium purple
                        
                        vec3 color = mix(color1, color2, n);
                        color = mix(color, color3, smoothstep(0.4, 0.6, n));
                        
                        // Add subtle vignette
                        float vignette = 1.0 - length(p) * 0.2;
                        color *= vignette;
                        
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
                uniforms: {
                    uTime: { value: 0 },
                    uResolution: { value: [window.innerWidth, window.innerHeight] },
                },
            })

            const resize = () => {
                renderer.setSize(window.innerWidth, window.innerHeight)
                program.uniforms.uResolution.value = [window.innerWidth, window.innerHeight]
            }
            resize()
            window.addEventListener('resize', resize)

            const mesh = new Mesh(gl, { geometry, program })

            let animationId: number
            const update = (t: number) => {
                animationId = requestAnimationFrame(update)
                program.uniforms.uTime.value = t * 0.001
                renderer.render({ scene: mesh })
            }

            update(0)

            cleanup = () => {
                window.removeEventListener('resize', resize)
                cancelAnimationFrame(animationId)
                if (gl.canvas && gl.canvas.parentNode) {
                    gl.canvas.parentNode.removeChild(gl.canvas)
                }
            }
        }

        init()

        return () => {
            if (cleanup) cleanup()
        }
    }, [])

    return <div ref={containerRef} className="fixed inset-0 w-full h-full -z-10" />
}
