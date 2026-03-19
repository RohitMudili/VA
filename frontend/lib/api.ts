const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface TokenResponse {
  token: string;
}

export interface ConfigResponse {
  livekit_url: string;
}

export interface AgentStartResponse {
  status: string;
  room: string;
  agent_type?: string;
}

export interface JoinRoomResponse {
  token: string;
  room_name: string;
  client_identity: string;
  livekit_url: string;
}

export interface EndSessionResponse {
  status: string;
  room: string;
}

export interface SessionStatusResponse {
  status: string;
  room_name: string;
  participants?: number;
  uptime?: number;
  created_at?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  context_loaded: boolean;
  context_size: number;
  approach: string;
  session_management: string;
}

export interface ActiveSessionsResponse {
  sessions: Record<string, any>;
  total_sessions: number;
  total_participants: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        // Try to get more detailed error from response body
        try {
          const errorBody = await response.text();
          if (errorBody) {
            errorMessage += ` - ${errorBody}`;
          }
        } catch (e) {
          // Ignore if we can't read the error body
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to backend - please ensure the server is running');
        }
      }
      
      throw error;
    }
  }

  // Add a method to check backend connectivity
  async checkConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch (error) {
      console.error('Backend connection check failed:', error);
      return false;
    }
  }

  async getToken(): Promise<TokenResponse> {
    return this.request<TokenResponse>('/token');
  }

  async getConfig(): Promise<ConfigResponse> {
    return this.request<ConfigResponse>('/config');
  }

  async startAgent(roomName?: string, agentType?: string): Promise<AgentStartResponse> {
    return this.request<AgentStartResponse>('/start-agent', {
      method: 'POST',
      body: JSON.stringify({ 
        room_name: roomName,
        agent_type: agentType 
      }),
    });
  }

  async joinRoom(roomName: string): Promise<JoinRoomResponse> {
    return this.request<JoinRoomResponse>('/join-room', {
      method: 'POST',
      body: JSON.stringify({ room_name: roomName }),
    });
  }

  async endSession(roomName: string, clientIdentity?: string): Promise<EndSessionResponse> {
    return this.request<EndSessionResponse>('/end-session', {
      method: 'POST',
      body: JSON.stringify({ 
        room_name: roomName,
        client_identity: clientIdentity 
      }),
    });
  }

  async getSessionStatus(roomName: string): Promise<SessionStatusResponse> {
    return this.request<SessionStatusResponse>(`/session-status/${roomName}`);
  }

  async getActiveSessions(): Promise<ActiveSessionsResponse> {
    return this.request<ActiveSessionsResponse>('/active-sessions');
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }
}

export const apiService = new ApiService(); 