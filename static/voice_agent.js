import {
    Room,
    RoomEvent,
    Track,
    createLocalTracks,
    LocalParticipant,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication
} from "/static/js/livekit-client.esm.mjs";

class VoiceAgentUI {
    constructor() {
        console.log("Initializing VoiceAgentUI");
        this.room = null;
        this.micTrack = null;
        this.agentStarted = false;
        
        // Get UI elements
        this.joinButton = document.getElementById('join');
        this.startAgentButton = document.getElementById('start-agent');
        this.logElement = document.getElementById('log');
        
        if (!this.joinButton) {
            console.error("Could not find join button!");
            return;
        }
        if (!this.startAgentButton) {
            console.error("Could not find start agent button!");
            return;
        }
        if (!this.logElement) {
            console.error("Could not find log element!");
            return;
        }

        console.log("Found all UI elements");
        
        // Bind event handlers
        this.joinButton.addEventListener('click', () => {
            console.log("Join button clicked - event handler triggered");
            this.joinRoom();
        });
        this.startAgentButton.addEventListener('click', () => {
            console.log("Start agent button clicked - event handler triggered");
            this.startAgent();
        });
        
        console.log("VoiceAgentUI initialized");
    }
    
    async joinRoom() {
        try {
            console.log("Join room button clicked");
            this.log("Joining room...");
            
            // Get token from server
            console.log("Fetching token from server");
            const tokenResponse = await fetch('/token');
            console.log("Token response status:", tokenResponse.status);
            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error("Token response error:", errorText);
                throw new Error(`Failed to get token: ${tokenResponse.statusText} - ${errorText}`);
            }
            const { token } = await tokenResponse.json();
            console.log("Token received successfully");
            
            // Get LiveKit URL from server
            console.log("Fetching LiveKit URL from server");
            const configResponse = await fetch('/config');
            console.log("Config response status:", configResponse.status);
            if (!configResponse.ok) {
                const errorText = await configResponse.text();
                console.error("Config response error:", errorText);
                throw new Error(`Failed to get config: ${configResponse.statusText} - ${errorText}`);
            }
            const { livekit_url } = await configResponse.json();
            console.log("LiveKit URL received:", livekit_url);
            
            if (!livekit_url) {
                throw new Error("LiveKit URL is empty");
            }

            // Create a new room with options
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            // Set up event listeners
            this.room
                .on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this))
                .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed.bind(this))
                .on(RoomEvent.Disconnected, this.handleDisconnect.bind(this));
            
            // Connect to LiveKit
            console.log("Connecting to LiveKit at:", livekit_url);
            try {
                await this.room.connect(livekit_url, token);
                console.log("Connected to LiveKit room");
                this.log("Connected to room");
            } catch (connectError) {
                console.error("LiveKit connection error:", connectError);
                throw new Error(`Failed to connect to LiveKit: ${connectError.message}`);
            }
            
            // Get microphone track
            console.log("Getting microphone track");
            try {
                const tracks = await createLocalTracks({
                    audio: true,
                    video: false,
                });
                this.micTrack = tracks[0];
                console.log("Microphone track created");
            } catch (micError) {
                console.error("Microphone error:", micError);
                throw new Error(`Failed to get microphone: ${micError.message}`);
            }
            
            // Publish microphone
            console.log("Publishing microphone");
            try {
                await this.room.localParticipant.publishTrack(this.micTrack);
                console.log("Microphone published");
                this.log("Microphone published");
            } catch (publishError) {
                console.error("Publish error:", publishError);
                throw new Error(`Failed to publish microphone: ${publishError.message}`);
            }
            
            // Show start agent button
            this.startAgentButton.classList.remove('hidden');
            
        } catch (error) {
            console.error("Error joining room:", error);
            this.log(`Error: ${error.message}`);
            this.cleanup();
        }
    }

    handleTrackSubscribed(track, publication, participant) {
        console.log("Track subscribed:", track.kind, "from", participant.identity);
        if (participant.identity.startsWith('agent-')) {
            console.log("Agent audio track received");
            this.log("Agent audio received");
            track.attach().play();
        }
    }

    handleTrackUnsubscribed(track, publication, participant) {
        console.log("Track unsubscribed:", track.kind, "from", participant.identity);
        track.detach();
    }

    handleDisconnect() {
        console.log("Room disconnected");
        this.log("Disconnected from room");
        this.cleanup();
    }
    
    async startAgent() {
        try {
            console.log("Start agent button clicked");
            this.log("Starting agent...");
            
            if (!this.room || !this.room.name) {
                throw new Error("No active room connection");
            }
            
            const response = await fetch(`/start-agent?room_name=${encodeURIComponent(this.room.name)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Start agent response error:", errorText);
                throw new Error(`Failed to start agent: ${response.statusText} - ${errorText}`);
            }
            
            console.log("Agent started successfully");
            this.log("Agent started");
            this.agentStarted = true;
            this.startAgentButton.disabled = true;
            
        } catch (error) {
            console.error("Error starting agent:", error);
            this.log(`Error: ${error.message}`);
        }
    }
    
    cleanup() {
        console.log("Cleaning up");
        if (this.micTrack) {
            this.micTrack.stop();
            this.micTrack = null;
        }
        if (this.room) {
            this.room.disconnect();
            this.room = null;
        }
        this.startAgentButton.classList.add('hidden');
        this.agentStarted = false;
    }
    
    log(message) {
        const li = document.createElement('li');
        li.textContent = message;
        this.logElement.appendChild(li);
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }
}

// Initialize the UI when the page loads
console.log("Page loaded, creating VoiceAgentUI instance");
const ui = new VoiceAgentUI();
