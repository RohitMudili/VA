"use client"

import { useState, useEffect } from "react"
import { Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"

interface FloatingMicButtonProps {
  className?: string
  onToggle?: (isActive: boolean) => void
}

export function FloatingMicButton({ className, onToggle }: FloatingMicButtonProps) {
  const [isActive, setIsActive] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Hide button when near the bottom of the page (footer area)
      const isNearBottom = scrollY + windowHeight > documentHeight - 200
      setIsVisible(!isNearBottom)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleToggle = () => {
    // Navigate to voice agent page instead of just toggling state
    router.push("/voice-agent")
  }

  // Hide button when on voice agent page or near the bottom of the page
  if (!isVisible || pathname === "/voice-agent") return null

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Pulsing rings - Always visible for better visual appeal */}
      <div className="absolute inset-0 rounded-full">
        {/* Outer pulsing ring */}
        <div
          className="absolute inset-0 rounded-full bg-blue-800 opacity-20 animate-ping"
          style={{ animationDuration: "2s" }}
        />

        {/* Middle pulsing ring */}
        <div
          className="absolute inset-1 rounded-full bg-blue-700 opacity-30 animate-pulse"
          style={{ animationDuration: "1.5s" }}
        />

        {/* Inner subtle ring */}
        <div
          className="absolute inset-2 rounded-full bg-blue-600 opacity-40 animate-pulse"
          style={{ animationDuration: "1s" }}
        />
      </div>

      {/* Main button */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95",
          "bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950",
          "flex items-center justify-center text-white",
          "focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50",
          "hover-glow-blue z-10",
        )}
        aria-label="Start voice call with SONIC AI"
        role="button"
        tabIndex={0}
      >
        <Mic className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
          Start Voice Chat
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  )
}
