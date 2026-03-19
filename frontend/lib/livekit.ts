import { Room, RoomEvent, RemoteParticipant, LocalParticipant, AudioTrack, RemoteAudioTrack } from 'livekit-client';

export interface LiveKitConfig {
  url: string;
  token: string;
  roomName: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  participantCount: number;
}

export class LiveKitService {
  private room: Room | null = null;
  private localParticipant: LocalParticipant | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    participantCount: 0
  };

  // Event callbacks
  private onConnectionStateChanged?: (state: ConnectionState) => void;
  private onParticipantConnected?: (participant: RemoteParticipant) => void;
  private onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  private onAudioTrackSubscribed?: (track: RemoteAudioTrack, participant: RemoteParticipant) => void;
  private onAudioTrackUnsubscribed?: (track: RemoteAudioTrack, participant: RemoteParticipant) => void;

  async connect(config: LiveKitConfig): Promise<void> {
    try {
      this.updateConnectionState({ isConnecting: true, error: null });

      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: {
            width: 640,
            height: 480,
          },
          facingMode: 'user',
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connect to room
      await this.room.connect(config.url, config.token, {
        autoSubscribe: true,
      });

      this.localParticipant = this.room.localParticipant;

      // Enable microphone
      await this.enableMicrophone();

      // Count only client participants, not agents
      const clientCount = Array.from(this.room.remoteParticipants.values())
        .filter(p => p.identity.startsWith('client-')).length;

      this.updateConnectionState({ 
        isConnected: true, 
        isConnecting: false, 
        error: null,
        participantCount: clientCount
      });

      console.log('Connected to LiveKit room:', config.roomName);
    } catch (error) {
      console.error('Failed to connect to LiveKit:', error);
      this.updateConnectionState({ 
        isConnected: false, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Connection failed'
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('Room connected');
      this.updateConnectionState({ isConnected: true, isConnecting: false, error: null });
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      console.log('Room disconnected:', reason);
      this.updateConnectionState({ 
        isConnected: false, 
        isConnecting: false, 
        error: reason ? `Disconnected: ${reason}` : null,
        participantCount: 0
      });
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      // Only count client participants, not agents
      const clientCount = Array.from(this.room!.remoteParticipants.values())
        .filter(p => p.identity.startsWith('client-')).length;
      this.updateConnectionState({ 
        participantCount: clientCount
      });
      this.onParticipantConnected?.(participant);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('Participant disconnected:', participant.identity);
      // Only count client participants, not agents
      const clientCount = Array.from(this.room!.remoteParticipants.values())
        .filter(p => p.identity.startsWith('client-')).length;
      this.updateConnectionState({ 
        participantCount: clientCount
      });
      this.onParticipantDisconnected?.(participant);
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant: RemoteParticipant) => {
      if (track.kind === 'audio') {
        console.log('Audio track subscribed from:', participant.identity);
        this.onAudioTrackSubscribed?.(track as RemoteAudioTrack, participant);
        
        // Auto-play audio from agent
        if (participant.identity.startsWith('agent-')) {
          const audioElement = track.attach();
          audioElement.autoplay = true;
          document.body.appendChild(audioElement);
        }
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant: RemoteParticipant) => {
      if (track.kind === 'audio') {
        console.log('Audio track unsubscribed from:', participant.identity);
        this.onAudioTrackUnsubscribed?.(track as RemoteAudioTrack, participant);
        
        // Remove audio element
        track.detach().forEach(element => element.remove());
      }
    });

    this.room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      console.log('Audio playback status changed');
    });
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.onConnectionStateChanged?.(this.connectionState);
  }

  async enableMicrophone(): Promise<void> {
    try {
      if (!this.room || !this.localParticipant) {
        throw new Error('Room not connected');
      }

      await this.localParticipant.setMicrophoneEnabled(true);
      console.log('Microphone enabled');
    } catch (error) {
      console.error('Failed to enable microphone:', error);
      throw error;
    }
  }

  async disableMicrophone(): Promise<void> {
    try {
      if (!this.room || !this.localParticipant) {
        throw new Error('Room not connected');
      }

      await this.localParticipant.setMicrophoneEnabled(false);
      console.log('Microphone disabled');
    } catch (error) {
      console.error('Failed to disable microphone:', error);
      throw error;
    }
  }

  async toggleMicrophone(): Promise<boolean> {
    try {
      if (!this.room || !this.localParticipant) {
        throw new Error('Room not connected');
      }

      const isMuted = this.localParticipant.isMicrophoneEnabled;
      await this.localParticipant.setMicrophoneEnabled(!isMuted);
      console.log('Microphone toggled:', !isMuted ? 'enabled' : 'disabled');
      return !isMuted;
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.room) {
        // Disable microphone before disconnecting
        if (this.localParticipant) {
          await this.localParticipant.setMicrophoneEnabled(false);
        }
        
        // Disconnect from room
        await this.room.disconnect();
        
        // Clear references
        this.room = null;
        this.localParticipant = null;
      }
      
      // Reset connection state
      this.updateConnectionState({ 
        isConnected: false, 
        isConnecting: false, 
        error: null,
        participantCount: 0
      });
      
      // Clear all event callbacks
      this.onConnectionStateChanged = undefined;
      this.onParticipantConnected = undefined;
      this.onParticipantDisconnected = undefined;
      this.onAudioTrackSubscribed = undefined;
      this.onAudioTrackUnsubscribed = undefined;
      
      console.log('Disconnected from LiveKit room');
    } catch (error) {
      console.error('Error disconnecting from room:', error);
      // Force cleanup even if disconnect fails
      this.room = null;
      this.localParticipant = null;
      this.updateConnectionState({ 
        isConnected: false, 
        isConnecting: false, 
        error: null,
        participantCount: 0
      });
      throw error;
    }
  }

  // Event setters
  setOnConnectionStateChanged(callback: (state: ConnectionState) => void): void {
    this.onConnectionStateChanged = callback;
  }

  setOnParticipantConnected(callback: (participant: RemoteParticipant) => void): void {
    this.onParticipantConnected = callback;
  }

  setOnParticipantDisconnected(callback: (participant: RemoteParticipant) => void): void {
    this.onParticipantDisconnected = callback;
  }

  setOnAudioTrackSubscribed(callback: (track: RemoteAudioTrack, participant: RemoteParticipant) => void): void {
    this.onAudioTrackSubscribed = callback;
  }

  setOnAudioTrackUnsubscribed(callback: (track: RemoteAudioTrack, participant: RemoteParticipant) => void): void {
    this.onAudioTrackUnsubscribed = callback;
  }

  // Getters
  getRoom(): Room | null {
    return this.room;
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  isConnecting(): boolean {
    return this.connectionState.isConnecting;
  }

  isMicrophoneEnabled(): boolean {
    return this.localParticipant?.isMicrophoneEnabled ?? false;
  }

  getParticipantCount(): number {
    if (!this.room) {
      return 0;
    }
    // Only count client participants, not agents
    return Array.from(this.room.remoteParticipants.values())
      .filter(p => p.identity.startsWith('client-')).length;
  }

  getClientParticipantCount(): number {
    return this.getParticipantCount();
  }
}

export const liveKitService = new LiveKitService(); 