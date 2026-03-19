"use client"

import { useEffect, useRef } from "react"

export function TechVisualization({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Constants
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    const centerX = width / 2
    const centerY = height / 2

    // Colors - using gray and greyish blue palette
    const colors = {
      background: "#1e293b", // slate-800
      primary: { r: 100, g: 116, b: 139 }, // slate-500 #64748b
      secondary: { r: 71, g: 85, b: 105 }, // slate-600 #475569
      accent: { r: 148, g: 163, b: 184 }, // slate-400 #94a3b8
      highlight: { r: 203, g: 213, b: 225 }, // slate-300 #cbd5e1
      nodes: { r: 226, g: 232, b: 240 }, // slate-200 #e2e8f0
      blueAccent: { r: 125, g: 211, b: 252 }, // sky-300 #7dd3fc
      blueLight: { r: 186, g: 230, b: 253 }, // sky-200 #bae6fd
    }

    // Helper function to convert RGB object to rgba string
    const rgba = (color: { r: number; g: number; b: number }, alpha: number) => {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
    }

    // Node class
    class Node {
      x: number
      y: number
      radius: number
      connections: Node[]
      speed: number
      angle: number
      distance: number
      opacity: number
      pulsePhase: number

      constructor(x: number, y: number, radius: number) {
        this.x = x
        this.y = y
        this.radius = radius
        this.connections = []
        this.speed = Math.random() * 0.005 + 0.002
        this.angle = Math.random() * Math.PI * 2
        this.distance = Math.random() * 50 + 20
        this.opacity = Math.random() * 0.5 + 0.5
        this.pulsePhase = Math.random() * Math.PI * 2
      }

      update(time: number) {
        // Orbit around the center
        this.angle += this.speed
        this.x = centerX + Math.cos(this.angle) * this.distance
        this.y = centerY + Math.sin(this.angle) * this.distance

        // Pulse effect
        this.opacity = 0.5 + Math.sin(time / 1000 + this.pulsePhase) * 0.2
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = rgba(colors.nodes, this.opacity)
        ctx.fill()

        // Draw glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2)
        gradient.addColorStop(0, rgba(colors.nodes, this.opacity * 0.5))
        gradient.addColorStop(1, rgba(colors.nodes, 0))
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      drawConnections(ctx: CanvasRenderingContext2D, time: number) {
        this.connections.forEach((node) => {
          const distance = Math.sqrt(Math.pow(this.x - node.x, 2) + Math.pow(this.y - node.y, 2))
          const opacity = Math.max(0, 1 - distance / 150) * this.opacity * node.opacity

          // Draw connection line with gradient
          const gradient = ctx.createLinearGradient(this.x, this.y, node.x, node.y)
          gradient.addColorStop(0, rgba(colors.highlight, opacity))
          gradient.addColorStop(1, rgba(colors.blueAccent, opacity))

          ctx.beginPath()
          ctx.moveTo(this.x, this.y)
          ctx.lineTo(node.x, node.y)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 1
          ctx.stroke()

          // Draw data packet moving along the connection
          const packetSpeed = 0.0005
          const packetPosition = (time * packetSpeed) % 1
          const packetX = this.x + (node.x - this.x) * packetPosition
          const packetY = this.y + (node.y - this.y) * packetPosition

          ctx.beginPath()
          ctx.arc(packetX, packetY, 2, 0, Math.PI * 2)
          ctx.fillStyle = rgba(colors.blueLight, 1)
          ctx.fill()
        })
      }
    }

    // Wave class
    class Wave {
      amplitude: number
      frequency: number
      speed: number
      color: { r: number; g: number; b: number }
      phase: number
      yOffset: number

      constructor(
        amplitude: number,
        frequency: number,
        speed: number,
        color: { r: number; g: number; b: number },
        yOffset: number,
      ) {
        this.amplitude = amplitude
        this.frequency = frequency
        this.speed = speed
        this.color = color
        this.phase = Math.random() * Math.PI * 2
        this.yOffset = yOffset
      }

      draw(ctx: CanvasRenderingContext2D, time: number) {
        ctx.beginPath()

        // Start at the left edge
        ctx.moveTo(0, height - this.yOffset)

        // Draw the wave
        for (let x = 0; x < width; x += 5) {
          const y =
            height - this.yOffset + Math.sin(x * this.frequency + time * this.speed + this.phase) * this.amplitude
          ctx.lineTo(x, y)
        }

        // Complete the path to form a shape
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
        ctx.closePath()

        // Fill with gradient
        const gradient = ctx.createLinearGradient(0, height - this.yOffset - this.amplitude, 0, height)
        gradient.addColorStop(0, rgba(this.color, 0))
        gradient.addColorStop(0.7, rgba(this.color, 0.1))
        gradient.addColorStop(1, rgba(this.color, 0.4))
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    // Create nodes
    const nodeCount = 15
    const nodes: Node[] = []

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2
      const distance = Math.random() * 80 + 40
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance
      const radius = Math.random() * 2 + 2

      nodes.push(new Node(x, y, radius))
    }

    // Create central node
    const centralNode = new Node(centerX, centerY, 6)
    nodes.push(centralNode)

    // Create connections
    nodes.forEach((node) => {
      // Connect to central node
      if (node !== centralNode) {
        node.connections.push(centralNode)
        centralNode.connections.push(node)
      }

      // Connect to some random nodes
      const connectionCount = Math.floor(Math.random() * 2) + 1
      for (let i = 0; i < connectionCount; i++) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)]
        if (randomNode !== node && !node.connections.includes(randomNode)) {
          node.connections.push(randomNode)
        }
      }
    })

    // Create waves
    const waves = [
      new Wave(15, 0.02, 0.001, colors.primary, 50),
      new Wave(20, 0.01, -0.0015, colors.secondary, 30),
      new Wave(25, 0.008, 0.002, colors.blueAccent, 10),
    ]

    // Animation function
    let animationId: number
    const animate = (time: number) => {
      try {
        // Clear canvas
        ctx.fillStyle = colors.background
        ctx.fillRect(0, 0, width, height)

        // Draw waves
        waves.forEach((wave) => wave.draw(ctx, time))

        // Update and draw nodes
        nodes.forEach((node) => node.update(time))

        // Draw connections first (so they appear behind nodes)
        nodes.forEach((node) => node.drawConnections(ctx, time))

        // Then draw nodes on top
        nodes.forEach((node) => node.draw(ctx))

        // Draw central glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100)
        gradient.addColorStop(0, rgba(colors.nodes, 0.2))
        gradient.addColorStop(1, rgba(colors.nodes, 0))
        ctx.beginPath()
        ctx.arc(centerX, centerY, 100, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Continue animation only if canvas is still available
        if (canvas && ctx && canvas.parentElement) {
          animationId = requestAnimationFrame(animate)
        }
      } catch (error) {
        console.warn("Animation error:", error)
        // Stop animation on error
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
      }
    }

    // Start animation
    animationId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className={`w-full h-full rounded-xl ${className}`} />
}
