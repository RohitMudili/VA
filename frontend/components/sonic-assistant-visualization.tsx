"use client"

import type React from "react"

import { MessageSquare, Mic } from "lucide-react"
import { VoiceVisualization } from "@/components/voice-visualization"
import { useRouter } from "next/navigation"

interface SonicAssistantVisualizationProps {
  className?: string
  message?: string
  clickable?: boolean
}

export function SonicAssistantVisualization({
  className = "",
  message = "I've analyzed your customer data and found three opportunities to increase retention. Would you like me to explain my recommendations?",
  clickable = true,
}: SonicAssistantVisualizationProps) {
  const router = useRouter()

  const handleClick = () => {
    if (clickable) {
      router.push("/voice-agent")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      router.push("/voice-agent")
    }
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#0f172a] ${className} ${
        clickable ? "cursor-pointer hover-scale transition-all duration-300 focus-ring" : ""
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? "Start voice call with SONIC AI" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {/* Visualization - Always circular */}
      <div className="w-full h-full">
        <VoiceVisualization darkMode={true} intensity={0.8} animated={true} />
      </div>

      {/* Message bubble */}
      {message && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-16 left-2 right-2 sm:left-4 sm:right-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg flex items-start gap-2 sm:gap-3 max-w-[95%] sm:max-w-[90%] mx-auto">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed">{message}</p>
          </div>
        </div>
      )}

      {/* Microphone button */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
          <Mic className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>

      {/* Click indicator overlay */}
      {clickable && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="bg-white/90 rounded-full px-3 py-2 sm:px-4 sm:py-2 shadow-lg">
            <span className="text-blue-500 font-medium text-sm sm:text-base">Start voice call</span>
          </div>
        </div>
      )}
    </div>
  )
}
