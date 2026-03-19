"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface VoiceVisualizationProps {
  className?: string
  darkMode?: boolean
  intensity?: number
  animated?: boolean
}

export function VoiceVisualization({
  className = "",
  darkMode = false,
  intensity = 0.8,
  animated = true,
}: VoiceVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<any[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Intersection Observer for performance optimization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    observer.observe(canvas)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Handle resize with debouncing
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    setDimensions({ width: rect.width, height: rect.height })
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    handleResize() // Initial call
    window.addEventListener("resize", debouncedResize)

    return () => {
      window.removeEventListener("resize", debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [handleResize])

  // Optimized animation setup - CIRCULAR ONLY
  const setupAnimation = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !isVisible || dimensions.width === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharpness
    const dpr = Math.min(window.devicePixelRatio || 1, 2) // Cap at 2 for performance
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    ctx.scale(dpr, dpr)

    // Constants
    const width = dimensions.width
    const height = dimensions.height
    const centerX = width / 2
    const centerY = height / 2
    const barWidth = Math.max(2, Math.min(4, width / 200)) // Responsive bar width

    // Optimized colors
    const colors = {
      primary: darkMode ? "#60a5fa" : "#38bdf8",
      secondary: darkMode ? "#3b82f6" : "#0ea5e9",
      accent: darkMode ? "#2563eb" : "#4f46e5",
      background: darkMode ? "#0f172a" : "transparent",
      glow: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(56, 189, 248, 0.1)",
    }

    // Create gradient once
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(centerX, centerY))
    gradient.addColorStop(0, colors.primary)
    gradient.addColorStop(0.5, colors.secondary)
    gradient.addColorStop(1, colors.accent)

    // Optimized bar count based on screen size
    const barCount = Math.min(32, Math.max(16, Math.floor(width / 20)))
    let bars: number[] = Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.2)

    // Initialize particles only once
    if (particlesRef.current.length === 0 && darkMode) {
      const particleCount = Math.min(20, Math.max(10, Math.floor(width / 40)))
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.8 + 0.3,
        opacity: Math.random() * 0.4 + 0.2,
      }))
    }

    let lastTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    // Optimized animation function
    const animate = (timestamp: number) => {
      if (!ctx || !canvas || !isVisible) return

      // Throttle to target FPS
      if (timestamp - lastTime < frameInterval) {
        if (animated) {
          animationRef.current = requestAnimationFrame(animate)
        }
        return
      }
      lastTime = timestamp

      // Clear canvas efficiently
      ctx.clearRect(0, 0, width, height)

      // Draw background
      if (darkMode) {
        ctx.fillStyle = colors.background
        ctx.fillRect(0, 0, width, height)

        // Background glow
        const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, height * 0.8)
        bgGradient.addColorStop(0, colors.glow)
        bgGradient.addColorStop(1, "rgba(15, 23, 42, 0)")
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, width, height)
      }

      // Calculate responsive radius
      const baseRadius = Math.min(centerX, centerY) * 0.6
      const radius = Math.max(50, Math.min(baseRadius, 200))

      // Update bar heights with smooth animation
      const time = timestamp / 1000
      const targetIntensity = intensity * (0.7 + Math.sin(time) * 0.3)

      bars = bars.map((height, i) => {
        const targetHeight =
          0.3 + Math.sin(time * 2 + i * 0.3) * 0.2 + Math.sin(time * 1.5 + i * 0.8) * 0.15 + (Math.random() - 0.5) * 0.1

        const scaledTarget = Math.max(0.1, targetHeight * targetIntensity)
        return height + (scaledTarget - height) * 0.12
      })

      // Draw outer glow ring
      if (darkMode) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.3)
        glowGradient.addColorStop(0, "rgba(59, 130, 246, 0.15)")
        glowGradient.addColorStop(1, "rgba(15, 23, 42, 0)")
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw circular bars
      const angleStep = (Math.PI * 2) / bars.length
      ctx.lineWidth = barWidth
      ctx.lineCap = "round"
      ctx.strokeStyle = gradient

      bars.forEach((height, i) => {
        const angle = i * angleStep
        const barHeight = height * radius * 0.6

        const innerRadius = radius * 0.4
        const outerRadius = innerRadius + barHeight

        const startX = centerX + Math.cos(angle) * innerRadius
        const startY = centerY + Math.sin(angle) * innerRadius
        const endX = centerX + Math.cos(angle) * outerRadius
        const endY = centerY + Math.sin(angle) * outerRadius

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      })

      // Draw center elements
      const centerRadius = radius * 0.25

      // Outer center circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2)
      ctx.fillStyle = darkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(56, 189, 248, 0.2)"
      ctx.fill()

      // Pulsing inner circle
      const pulseSize = centerRadius * (0.6 + Math.sin(time * 3) * 0.2)
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2)
      ctx.fillStyle = colors.primary
      ctx.fill()

      // Draw particles (reduced frequency for performance)
      if (darkMode && particlesRef.current.length > 0) {
        ctx.globalAlpha = 0.6
        particlesRef.current.forEach((particle) => {
          particle.y -= particle.speed
          if (particle.y < -particle.radius) {
            particle.y = height + particle.radius
            particle.x = Math.random() * width
          }

          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(96, 165, 250, ${particle.opacity})`
          ctx.fill()
        })
        ctx.globalAlpha = 1
      }

      // Continue animation
      if (animated && isVisible) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Start animation
    if (animated && isVisible) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isVisible, darkMode, intensity, animated, dimensions])

  useEffect(() => {
    const cleanup = setupAnimation()
    return cleanup
  }, [setupAnimation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      particlesRef.current = []
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${className}`}
        style={{
          borderRadius: "0.75rem",
          background: darkMode ? "#0f172a" : "transparent",
          touchAction: "none", // Prevent touch scrolling on canvas
        }}
        role="img"
        aria-label="Interactive circular voice visualization showing AI voice agent activity"
        aria-describedby="voice-viz-description"
      />
      <div id="voice-viz-description" className="sr-only">
        An animated circular visualization representing AI voice agent activity with pulsing bars radiating from the
        center
      </div>
    </>
  )
}
