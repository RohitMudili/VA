"use client"

import { useCallback } from "react"
import { VoiceVisualization } from "@/components/voice-visualization"
import { FloatingMicButton } from "@/components/floating-mic-button"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  const handleVisualizationClick = useCallback(() => {
    router.push("/voice-agent")
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0e27]">
      {/* Voice Visualization Box */}
      <div className="w-full max-w-4xl px-4">
        <div
          className="rounded-xl overflow-hidden bg-[#0f172a] shadow-2xl w-full cursor-pointer hover:shadow-blue-500/20 transition-all duration-300"
          onClick={handleVisualizationClick}
        >
          {/* Voice Visualization */}
          <div className="w-full aspect-video">
            <VoiceVisualization darkMode={true} intensity={0.8} animated={true} />
          </div>

          {/* Click overlay with hint */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="bg-white/90 rounded-full px-6 py-3 shadow-lg">
              <span className="text-blue-600 font-medium text-lg">Start voice call</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mic Button */}
      <FloatingMicButton />
    </main>
  )
}
