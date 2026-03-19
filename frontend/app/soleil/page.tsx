"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { VoiceVisualization } from "@/components/voice-visualization"
import { Mic, MicOff, Square } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiService } from "@/lib/api"
import { liveKitService, ConnectionState } from "@/lib/livekit"

export default function SoleilPage() {
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [roomName, setRoomName] = useState<string>("")
  const [clientIdentity, setClientIdentity] = useState<string>("")
  const [participantCount, setParticipantCount] = useState(0)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const agentAudioRef = useRef<HTMLAudioElement | null>(null)
  const router = useRouter()

  // Handle connection state changes from LiveKit
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    setIsConnected(state.isConnected)
    setIsConnecting(state.isConnecting)
    setConnectionError(state.error)
    setParticipantCount(state.participantCount)
    
    // Update mute state based on microphone status
    if (state.isConnected) {
      setIsMuted(!liveKitService.isMicrophoneEnabled())
    }
  }, [])

  // Check backend connectivity first
  useEffect(() => {
    const checkBackend = async () => {
      const isConnected = await apiService.checkConnection()
      setBackendConnected(isConnected)
      
      if (!isConnected) {
        setConnectionError('Unable to connect to backend server')
        setIsConnecting(false)
      }
    }
    
    checkBackend()
  }, [])

  // Real connection process
  useEffect(() => {
    let mounted = true

    const connectToVoiceAgent = async () => {
      // Don't try to connect if backend is not available
      if (backendConnected === false) {
        return
      }
      
      // Wait for backend check to complete
      if (backendConnected === null) {
        return
      }

      try {
        setConnectionError(null)
        setIsConnecting(true)

        // Step 1: Start agent (creates room if needed) - Use soleil agent type
        console.log('Starting Soleil agent...')
        const agentResponse = await apiService.startAgent(undefined, 'soleil')
        const roomName = agentResponse.room
        setRoomName(roomName)

        // Step 2: Join the room
        console.log('Joining room:', roomName)
        const joinResponse = await apiService.joinRoom(roomName)
        setClientIdentity(joinResponse.client_identity)

        // Step 3: Set up LiveKit event handlers
        liveKitService.setOnConnectionStateChanged(handleConnectionStateChange)
        
        liveKitService.setOnParticipantConnected((participant) => {
          console.log('Agent connected:', participant.identity)
        })

        liveKitService.setOnAudioTrackSubscribed((track, participant) => {
          console.log('Audio track from agent:', participant.identity)
          if (participant.identity.startsWith('agent-')) {
            setIsAgentSpeaking(true)
            // Listen for audio end event
            const audioElement = track.attach()
            agentAudioRef.current = audioElement
            audioElement.onended = () => setIsAgentSpeaking(false)
            audioElement.onpause = () => setIsAgentSpeaking(false)
            audioElement.onplay = () => setIsAgentSpeaking(true)
            // Remove previous listeners if any
            audioElement.onabort = () => setIsAgentSpeaking(false)
            // Clean up after playback
            audioElement.addEventListener('ended', () => setIsAgentSpeaking(false))
            audioElement.addEventListener('pause', () => setIsAgentSpeaking(false))
            audioElement.addEventListener('play', () => setIsAgentSpeaking(true))
          }
        })

        liveKitService.setOnAudioTrackUnsubscribed((track, participant) => {
          if (participant.identity.startsWith('agent-')) {
            setIsAgentSpeaking(false)
            if (agentAudioRef.current) {
              agentAudioRef.current.onended = null
              agentAudioRef.current.onpause = null
              agentAudioRef.current.onplay = null
              agentAudioRef.current.onabort = null
              agentAudioRef.current = null
            }
          }
        })

        // Step 4: Connect to LiveKit room
        console.log('Connecting to LiveKit...')
        await liveKitService.connect({
          url: joinResponse.livekit_url,
          token: joinResponse.token,
          roomName: roomName
        })

        if (mounted) {
          console.log('Successfully connected to Soleil voice agent')
          setRetryCount(0) // Reset retry count on successful connection
        }
      } catch (error) {
        console.error('Connection error:', error)
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Connection failed'
          setConnectionError(errorMessage)
          setIsConnecting(false)
          
          // Increment retry count
          setRetryCount(prev => prev + 1)
        }
      }
    }

    connectToVoiceAgent()

    return () => {
      mounted = false
    }
  }, [handleConnectionStateChange, backendConnected])

  // Retry connection function
  const retryConnection = useCallback(async () => {
    setRetryCount(0)
    setConnectionError(null)
    setIsConnecting(true)
    
    // Check backend first
    const isBackendConnected = await apiService.checkConnection()
    setBackendConnected(isBackendConnected)
    
    if (!isBackendConnected) {
      setConnectionError('Backend server is not responding')
      setIsConnecting(false)
      return
    }
    
    // Trigger reconnection by updating the dependency
    window.location.reload()
  }, [])

  const toggleMute = useCallback(async () => {
    try {
      if (!isConnected) return

      const newMuteState = await liveKitService.toggleMicrophone()
      setIsMuted(!newMuteState)
      console.log('Microphone toggled:', newMuteState ? 'enabled' : 'disabled')
    } catch (error) {
      console.error('Failed to toggle microphone:', error)
      setConnectionError('Failed to toggle microphone')
    }
  }, [isConnected])

  const endCall = useCallback(async () => {
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
      console.log('Ending call...')
      
      // Step 1: Disconnect from LiveKit
      if (liveKitService.isConnected()) {
        await liveKitService.disconnect()
      }
      
      // Step 2: End session on backend
      if (roomName && clientIdentity) {
        try {
          await apiService.endSession(roomName, clientIdentity)
          console.log('Session ended on backend')
        } catch (error) {
          console.warn('Failed to end session on backend:', error)
          // Continue with navigation even if backend call fails
        }
      }
      
      // Step 3: Clear local state
      setRoomName("")
      setClientIdentity("")
      setParticipantCount(0)
      setIsConnected(false)
      
      // Step 4: Navigate back to home
      setTimeout(() => {
        router.push("/")
      }, 500)
    } catch (error) {
      console.error("Error ending call:", error)
      // Force navigation even if everything fails
      setConnectionError('Failed to end call properly')
      setTimeout(() => {
        router.push("/")
      }, 1000)
    }
  }, [roomName, clientIdentity, router])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up...')
      if (liveKitService.isConnected()) {
        liveKitService.disconnect().catch(error => {
          console.warn('Error during cleanup disconnect:', error)
        })
      }
      
      // Clear any remaining audio elements
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(element => {
        if (element.src.includes('livekit')) {
          element.remove()
        }
      })
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white shadow-sm py-4">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center text-gray-700 hover:text-[#0A64BC] transition-colors hover-lift click-shrink focus-ring rounded-md p-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#0A64BC] flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">SONIC AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Voice agent interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            <span className="text-[#0A64BC]">Soleil</span> Hair Spa Voice Agent
          </h1>

          {/* Voice visualization container */}
          <div className="w-full aspect-video max-w-2xl rounded-xl overflow-hidden shadow-2xl mb-6 sm:mb-8 relative">
            {isConnecting ? (
              <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-[#0A64BC] border-t-transparent rounded-full mb-4"></div>
                <p className="text-white text-lg">
                  {roomName ? 'Connecting to Soleil voice agent...' : 'Initializing connection...'}
                </p>
              </div>
            ) : connectionError ? (
              <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center">
                <div className="text-red-600 text-lg mb-4">Connection Error</div>
                <p className="text-red-500 text-sm text-center px-4 mb-4">{connectionError}</p>
                <Button 
                  onClick={retryConnection} 
                  className="mt-4"
                  variant="outline"
                >
                  Retry Connection
                </Button>
              </div>
            ) : (
              <div className="w-full h-full">
                <VoiceVisualization 
                  darkMode={true} 
                  intensity={isMuted ? 0.3 : 0.8} 
                  animated={isAgentSpeaking} 
                />
              </div>
            )}
          </div>

          {/* Controls - Repositioned for better mobile experience */}
          <div className="w-full max-w-md">
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                disabled={!isConnected || isConnecting}
                className={`w-full sm:min-w-[140px] hover-glow click-shrink ${
                  isMuted ? "bg-red-500 hover:bg-red-600" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {isMuted ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>

              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                disabled={isConnecting && !isConnected}
                className="w-full sm:min-w-[140px] bg-red-500 hover:bg-red-600 hover-glow click-shrink"
              >
                <Square className="mr-2 h-4 w-4" />
                End call
              </Button>
            </div>
          </div>
          
          {/* Connection status indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${
              backendConnected === null ? 'bg-gray-400' :
              backendConnected === false ? 'bg-red-500' :
              isConnected ? 'bg-green-500' :
              isConnecting ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-gray-500">
              {backendConnected === null ? 'Checking backend...' :
               backendConnected === false ? 'Backend offline' :
               isConnected ? 'Soleil agent connected' :
               isConnecting ? 'Connecting...' :
               'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
