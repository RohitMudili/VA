import os
import logging
import aiohttp
import asyncio
import time
from dotenv import load_dotenv
import uuid

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Time the LiveKit imports
livekit_import_start = time.time()
from livekit import rtc
from livekit.rtc import Room, RoomOptions
from livekit.api import AccessToken, VideoGrants
from livekit.agents.llm import ChatContext, ChatMessage
from livekit.agents import Agent, AgentSession
from livekit.plugins import deepgram, silero, cartesia, google

livekit_import_time = time.time() - livekit_import_start
print(f"LiveKit imports took: {livekit_import_time:.3f} seconds")

# ─── CONFIG & LOGGING ──────────────────────────────────
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("polymaiths-voice-agent")

# Environment variables
LIVEKIT_API = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
DEEPGRAM_KEY = os.getenv("DEEPGRAM_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# CORS Configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:8000"
).split(",")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "3000"))

if not all([LIVEKIT_URL, LIVEKIT_API, LIVEKIT_SECRET, DEEPGRAM_KEY, GOOGLE_API_KEY]):
    raise RuntimeError("Missing required .env variables.")

# ─── GLOBAL SESSION TRACKING ─────────────────────────────
active_sessions = {}  # Track active voice agent sessions

# ─── HELPERS ──────────────────────────────────────────────


def load_text(path: str) -> str:
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read().strip()
        logger.info(f"Successfully loaded text from {path}")
        return content
    except FileNotFoundError:
        logger.warning(f"File not found: {path}")
        return ""
    except Exception as e:
        logger.error(f"Error loading text from {path}: {e}")
        return ""


def generate_token(identity: str, room_name: str = "voice-agent-room") -> str:
    """Generate a LiveKit JWT for a given identity with appropriate grants."""
    grant = VideoGrants(
        room_join=True, room=room_name, can_publish=True, can_subscribe=True
    )
    token = (
        AccessToken(api_key=LIVEKIT_API, api_secret=LIVEKIT_SECRET)
        .with_identity(identity)
        .with_grants(grant)
        .to_jwt()
    )
    logger.info(f"Token generated successfully for {identity} in room {room_name}")
    return token


def create_vad_instance() -> silero.VAD:
    """Create a new VAD instance with optimized settings for low latency"""
    vad = silero.VAD.load(
        activation_threshold=0.5,
        min_speech_duration=0.1,
        min_silence_duration=0.2,  # Reduced from 0.3 for faster detection
        prefix_padding_duration=0.2,  # Reduced from 0.3 for faster response
        max_buffered_speech=60.0,
        sample_rate=16000,
        force_cpu=True,
    )
    logger.info("New VAD instance created with low-latency settings")
    return vad


def load_knowledge_context() -> str:
    """Load and cache the complete knowledge context from PolymAIths knowledge files"""
    cache_key = "cached_polymaiths_knowledge"

    if not hasattr(load_knowledge_context, cache_key):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            logger.info(f"Current script directory: {current_dir}")

            # PolymAIths knowledge files
            kb_filename = "knowledge(leads).md"
            rules_filename = "prompts(leads).md"

            # Try multiple possible file locations
            possible_file_locations = [
                (
                    os.path.join(current_dir, "..", "Prompts", kb_filename),
                    os.path.join(current_dir, "..", "Prompts", rules_filename),
                ),
                (
                    os.path.join(current_dir, "Prompts", kb_filename),
                    os.path.join(current_dir, "Prompts", rules_filename),
                ),
                (
                    os.path.join(current_dir, kb_filename),
                    os.path.join(current_dir, rules_filename),
                ),
            ]

            kb_content = ""
            rules_content = ""

            for kb_path, rules_path in possible_file_locations:
                if not kb_content and os.path.exists(kb_path):
                    kb_content = load_text(kb_path)
                    logger.info(f"✓ Loaded KB from: {kb_path}")

                if not rules_content and os.path.exists(rules_path):
                    rules_content = load_text(rules_path)
                    logger.info(f"✓ Loaded Rules from: {rules_path}")

                if kb_content and rules_content:
                    break

            # Create comprehensive context for PolymAIths
            if kb_content and rules_content:
                knowledge_context = f"""
{rules_content}

KNOWLEDGE BASE - Complete information about PolymAIths:

{kb_content}

CRITICAL PRODUCT NAME PRONUNCIATION:
- Product names are SINGLE WORDS, not acronyms
- Say "Evernest" as one word (like "ever-nest"), NOT "E-V-E-R-N-E-S-T"
- Say "Tenent" as one word (like "ten-ent"), NOT "T-E-N-E-N-T"
- Say "Keynest" as one word (like "key-nest"), NOT "K-E-Y-N-E-S-T"
- Say "Echovest" as one word (like "echo-vest"), NOT "E-C-H-O-V-E-S-T"
- Say "Opencare" as one word (like "open-care"), NOT "O-P-E-N-C-A-R-E"
- Say "Healdesk" as one word (like "heal-desk"), NOT "H-E-A-L-D-E-S-K"

CRITICAL MULTILINGUAL RESPONSE RULES:
- ALWAYS respond in the SAME LANGUAGE as the user's question
- If the user speaks in English, respond in English
- If the user speaks in Spanish (Español), respond in Spanish
- If the user speaks in German (Deutsch), respond in German
- Detect the language naturally from the user's input and mirror it in your response

CRITICAL FORMATTING RULES FOR VOICE RESPONSES:
- NEVER use asterisks (*) or bullet points in responses
- NEVER use numbered lists (1., 2., 3.) in responses
- When listing multiple items, use natural conversational flow
- Use connecting words like "also", "plus", "and", "additionally" instead of bullet points
- Sound natural and conversational, not like you're reading a list
- Remember this is VOICE conversation - speak naturally

IMPORTANT: You have all the information you need above. Answer questions directly from this knowledge without mentioning knowledge bases, tools, or looking things up. You ARE the expert on PolymAIths' services.
"""
            elif kb_content:
                knowledge_context = f"""
You are a helpful assistant for PolymAIths.

KNOWLEDGE BASE - Complete information about our services:

{kb_content}

CRITICAL PRODUCT NAME PRONUNCIATION:
- Product names are SINGLE WORDS, not acronyms
- Say "Evernest" as one word (like "ever-nest"), NOT "E-V-E-R-N-E-S-T"
- Say "Tenent" as one word (like "ten-ent"), NOT "T-E-N-E-N-T"
- Say "Keynest" as one word (like "key-nest"), NOT "K-E-Y-N-E-S-T"
- Say "Echovest" as one word (like "echo-vest"), NOT "E-C-H-O-V-E-S-T"
- Say "Opencare" as one word (like "open-care"), NOT "O-P-E-N-C-A-R-E"
- Say "Healdesk" as one word (like "heal-desk"), NOT "H-E-A-L-D-E-S-K"

CRITICAL MULTILINGUAL RESPONSE RULES:
- ALWAYS respond in the SAME LANGUAGE as the user's question
- If the user speaks in English, respond in English
- If the user speaks in Spanish (Español), respond in Spanish
- If the user speaks in German (Deutsch), respond in German
- Detect the language naturally from the user's input and mirror it in your response

CRITICAL FORMATTING RULES FOR VOICE RESPONSES:
- NEVER use asterisks (*) or bullet points in responses
- NEVER use numbered lists (1., 2., 3.) in responses
- When listing multiple items, use natural conversational flow
- Use connecting words like "also", "plus", "and", "additionally" instead of bullets
- Sound natural and conversational, not like you're reading a list
- Remember this is VOICE conversation - speak naturally

IMPORTANT: You have all the information you need above. Answer questions directly from this knowledge. You ARE the expert on PolymAIths' services.
"""
            else:
                knowledge_context = """You are a helpful AI assistant for PolymAIths, a team of polymaths that help restructure overwhelmed and bureaucratic industries through customised B2B and B2C ecosystems.

CRITICAL MULTILINGUAL RESPONSE RULES:
- ALWAYS respond in the SAME LANGUAGE as the user's question
- If the user speaks in English, respond in English
- If the user speaks in Spanish (Español), respond in Spanish
- If the user speaks in German (Deutsch), respond in German
- Detect the language naturally from the user's input and mirror it in your response"""

            setattr(load_knowledge_context, cache_key, knowledge_context)

        except Exception as e:
            logger.error(f"Error loading knowledge context: {e}")
            knowledge_context = "You are a helpful AI assistant for PolymAIths."
            setattr(load_knowledge_context, cache_key, knowledge_context)

    return getattr(load_knowledge_context, cache_key)


# ─── AGENT WORKER ─────────────────────────────────────────


async def process_audio(room_name: str, custom_context: str = None) -> None:
    """Process audio with isolated resources."""
    logger.info(f"Starting PolymAIths agent process for room: {room_name}")

    # Create isolated HTTP session for this agent with proper timeout and connection pooling
    timeout = aiohttp.ClientTimeout(total=30, connect=5, sock_read=10)
    connector = aiohttp.TCPConnector(
        limit=10, ttl_dns_cache=300, enable_cleanup_closed=True
    )
    async with aiohttp.ClientSession(
        timeout=timeout, connector=connector
    ) as http_session:
        try:
            token = generate_token(f"agent-{room_name}", room_name)
            room = Room()

            participant_greeted = set()
            request_start_times = {}
            session_active = True
            session = None
            agent = None

            async def send_proactive_greeting():
                """Send initial greeting when client connects"""
                await asyncio.sleep(1)

                try:
                    client_participants = [
                        p
                        for p in room.remote_participants.values()
                        if p.identity.startswith("client-")
                    ]

                    if client_participants and agent and len(participant_greeted) == 0:
                        logger.info("Sending proactive greeting")
                        # Echovest greeting - voice-first smart agent by PolymAIths
                        greeting = "Hello! I'm Echovest, your voice-first smart agent by PolymAIths. I'm here to help US real estate investors like yourself. How can I assist you today?"

                        if session and hasattr(session, "say"):
                            session.say(text=greeting)
                            logger.info("✓ Sent proactive greeting")

                            for participant in client_participants:
                                participant_greeted.add(participant.identity)
                        else:
                            logger.warning(
                                "Session say method not available for greeting"
                            )

                except Exception as e:
                    logger.error(f"Error sending proactive greeting: {e}")

            @room.on("participant_connected")
            def on_participant_connected(participant):
                connect_time = time.time()
                logger.info(
                    f"PARTICIPANT CONNECTED: {participant.identity} at {connect_time} in room {room_name}"
                )

                all_clients = [
                    p
                    for p in room.remote_participants.values()
                    if p.identity.startswith("client-")
                ]
                if len(all_clients) > 1:
                    logger.warning(
                        f"WARNING: Multiple clients detected in room {room_name}: {[p.identity for p in all_clients]}"
                    )

                if participant.identity.startswith("client-"):
                    logger.info(
                        f"NEW CLIENT: {participant.identity} - will send greeting after tracks are ready"
                    )

            @room.on("track_subscribed")
            def on_track_subscribed(track, publication, participant):
                sub_time = time.time()
                logger.info(
                    f"TRACK SUBSCRIBED: {track.kind} from {participant.identity} at {sub_time}"
                )

                if (
                    track.kind == rtc.TrackKind.KIND_AUDIO
                    and participant.identity.startswith("client-")
                ):
                    logger.info("CLIENT AUDIO READY - Triggering proactive greeting")
                    asyncio.create_task(send_proactive_greeting())

            @room.on("track_published")
            def on_track_published(publication, participant):
                pub_time = time.time()
                logger.info(
                    f"TRACK PUBLISHED: {publication.kind} by {participant.identity} at {pub_time}"
                )

                if publication.kind == rtc.TrackKind.KIND_AUDIO:
                    if participant.identity.startswith("client-"):
                        logger.info("CLIENT AUDIO TRACK PUBLISHED - User is speaking")
                        request_start_times[participant.identity] = pub_time
                    elif participant.identity.startswith("agent-"):
                        logger.info("AGENT AUDIO TRACK PUBLISHED - Agent is responding")
                        if participant.identity in request_start_times:
                            response_time = (
                                pub_time - request_start_times[participant.identity]
                            )
                            logger.info(
                                f"Response latency: {response_time:.3f} seconds"
                            )

            @room.on("participant_disconnected")
            def on_participant_disconnected(participant):
                nonlocal session_active
                disconnect_time = time.time()
                logger.info(
                    f"PARTICIPANT DISCONNECTED: {participant.identity} at {disconnect_time}"
                )
                participant_greeted.discard(participant.identity)
                request_start_times.pop(participant.identity, None)

                remaining_clients = [
                    p
                    for p in room.remote_participants.values()
                    if p.identity.startswith("client-")
                ]
                if not remaining_clients:
                    logger.info("No clients remaining - will end session")
                    session_active = False

            @room.on("disconnected")
            def on_disconnected():
                nonlocal session_active
                logger.info("Room disconnected")
                session_active = False

            await room.connect(
                url=str(LIVEKIT_URL),
                token=token,
                options=RoomOptions(auto_subscribe=True),
            )
            logger.info(f"Agent joined room: {room_name}")

            # Use custom context or load default
            if custom_context:
                knowledge_context = custom_context
                logger.info("Using custom context")
            else:
                knowledge_context = load_knowledge_context()
                logger.info("Knowledge base loaded for PolymAIths")

            # Create agent without tools
            initial_context = ChatContext(
                [ChatMessage(role="system", content=[knowledge_context])]
            )

            agent = Agent(
                instructions=knowledge_context,
                chat_ctx=initial_context,
            )
            logger.info(f"Agent created with {len(knowledge_context)} chars of context")

            # Configure STT with connection pooling - Using Nova-3 for sub-300ms latency
            # Using language="multi" for automatic multilingual code-switching (EN, ES, DE)
            stt = deepgram.STT(
                model="nova-3",
                api_key=str(DEEPGRAM_KEY),
                language="multi",  # Enables real-time multilingual code-switching
                http_session=http_session,
            )

            # Optimized LLM for low-latency voice responses - Using Google Gemini 3 Flash
            llm = google.LLM(
                model="gemini-3-flash-preview",
                temperature=0.5,
                api_key=str(GOOGLE_API_KEY),
            )

            # Cartesia TTS for ultra-low latency (80-135ms vs 500-800ms)
            # sonic-2-2025-03-07 supports 15 languages including EN, ES, DE
            # Using language="en" as default; the model will adapt to the transcript language
            tts = cartesia.TTS(
                model="sonic-2-2025-03-07",
                api_key=str(os.getenv("CARTESIA_API_KEY")),
                language="en",  # Default to English, will work with multilingual input
                voice="829ccd10-f8b3-43cd-b8a0-4aeaa81f3b30",  # Professional male voice (multilingual)
                speed="normal",  # Normal speed for clear comprehension without being too sluggish
                http_session=http_session,  # Pass the shared HTTP session
            )

            # Create dedicated VAD instance for this session
            vad_instance = create_vad_instance()

            session = AgentSession(
                vad=vad_instance,
                stt=stt,
                llm=llm,
                tts=tts,
            )
            logger.info("Agent session created with all components")

            logger.info("Waiting for participants...")
            await asyncio.sleep(1)
            logger.info(
                f"After 1s wait - Remote participants: {len(room.remote_participants)}"
            )

            try:
                logger.info("Starting persistent session...")
                session_start = time.time()

                session_task = asyncio.create_task(
                    session.start(agent=agent, room=room)
                )
                logger.info("Session task created and starting...")
                logger.info(
                    f"Room has {len(room.remote_participants)} participants at session start"
                )

                await asyncio.sleep(2.0)
                logger.info("Session should be initialized now")

                # Keep session alive while there are participants
                session_running = True
                while session_active and room.remote_participants:
                    try:
                        done, pending = await asyncio.wait([session_task], timeout=5.0)

                        if done:
                            try:
                                result = await session_task
                                logger.info(
                                    "Session initialization completed - agent is now active"
                                )
                                session_running = False
                            except Exception as e:
                                logger.error(f"Session task error: {e}")
                                if "Connector is closed" in str(e):
                                    logger.error(
                                        "HTTP connector was closed prematurely"
                                    )
                                break

                        if not session_running and room.remote_participants:
                            await asyncio.sleep(1)

                        elapsed = time.time() - session_start
                        if int(elapsed) % 30 == 0:
                            logger.info(
                                f"Agent active for {elapsed:.1f}s, participants: {len(room.remote_participants)}"
                            )

                    except asyncio.TimeoutError:
                        continue

                # Clean shutdown
                if not session_task.done():
                    logger.info("Stopping session as no participants remain")
                    session_task.cancel()
                    try:
                        await session_task
                    except asyncio.CancelledError:
                        pass
                else:
                    try:
                        await session_task
                    except Exception as e:
                        logger.error(f"Session task error on completion: {e}")

                await asyncio.sleep(1)

                session_end = time.time()
                session_duration = session_end - session_start
                logger.info(
                    f"Session ended. Total duration: {session_duration:.3f} seconds"
                )

            except Exception as session_error:
                logger.error(f"Session error: {session_error}")
                logger.exception("Session error details:")

            logger.info("Waiting for pending operations to complete...")
            await asyncio.sleep(3)

            try:
                await room.disconnect()
                logger.info(f"Room disconnected for: {room_name}")
            except Exception as e:
                logger.error(f"Error disconnecting room: {e}")

            logger.info(f"Agent session fully ended for: {room_name}")

        except Exception as e:
            logger.error(f"Agent process error for room {room_name}: {e}")
            logger.exception("Full traceback:")
            raise


async def run_agent_for_room(room_name: str):
    """Enhanced wrapper for agent process with session tracking."""
    try:
        if room_name in active_sessions:
            active_sessions[room_name]["status"] = "running"

        await process_audio(room_name)

    except Exception as e:
        logger.exception(f"Agent job error for room {room_name}: {e}")

        if room_name in active_sessions:
            active_sessions[room_name]["status"] = "error"
            active_sessions[room_name]["error"] = str(e)
    finally:
        if room_name in active_sessions:
            logger.info(f"Cleaning up session for room: {room_name}")
            del active_sessions[room_name]


# ─── FASTAPI APP ──────────────────────────────────────────
app = FastAPI(title="PolymAIths Voice Agent API")


@app.on_event("startup")
async def _startup():
    # Pre-load knowledge context
    load_knowledge_context()
    logger.info("PolymAIths knowledge context pre-loaded")


@app.on_event("shutdown")
async def _shutdown():
    logger.info("Server shutting down")


# CORS origins from environment variable
ORIGINS = [origin.strip() for origin in CORS_ORIGINS]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ─── REQUEST MODELS ──────────────────────────────────────
class StartAgentRequest(BaseModel):
    room_name: Optional[str] = None


class JoinRoomRequest(BaseModel):
    room_name: str


class EndSessionRequest(BaseModel):
    room_name: str
    client_identity: Optional[str] = None


class CreateSessionRequest(BaseModel):
    session_name: Optional[str] = None


# ─── API ENDPOINTS ──────────────────────────────────────


@app.get("/")
async def root():
    return {
        "message": "PolymAIths Voice Agent API",
        "status": "running",
        "version": "3.0.0",
        "agent": "polymaiths",
        "endpoints": [
            "/health",
            "/token",
            "/config",
            "/start-agent",
            "/join-room",
            "/end-session",
            "/create-session",
            "/session-status/{room_name}",
            "/active-sessions",
        ],
    }


@app.get("/token")
async def get_token():
    try:
        unique_room_name = f"voice-agent-room-{uuid.uuid4()}"
        client_identity = f"client-{uuid.uuid4()}"

        logger.info(
            f"Generating token for {client_identity} in room {unique_room_name}"
        )
        token = generate_token(client_identity, unique_room_name)
        logger.info(f"Token generated successfully for {client_identity}")

        return {
            "token": token,
            "room_name": unique_room_name,
            "client_identity": client_identity,
        }
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/config")
async def get_config():
    try:
        logger.info("Getting config for frontend")
        return {"livekit_url": LIVEKIT_URL}
    except Exception as e:
        logger.error(f"Error getting config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/start-agent")
async def start_agent(background_tasks: BackgroundTasks, request: StartAgentRequest):
    try:
        room_name = request.room_name or f"voice-agent-room-{uuid.uuid4()}"

        logger.info(f"Starting PolymAIths agent for room: {room_name}")

        if room_name in active_sessions:
            logger.info(f"Agent already exists for room: {room_name}")
            return {"status": "agent-already-active", "room": room_name}

        active_sessions[room_name] = {
            "status": "starting",
            "created_at": time.time(),
            "participants": 0,
            "client_identities": [],
        }

        background_tasks.add_task(run_agent_for_room, room_name)
        logger.info(f"PolymAIths agent started for room: {room_name}")

        return {"status": "agent-started", "room": room_name}
    except Exception as e:
        logger.error(f"Error starting agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/join-room")
async def join_room(request: JoinRoomRequest):
    try:
        room_name = request.room_name

        client_identity = f"client-{uuid.uuid4()}"
        token = generate_token(client_identity, room_name)

        if room_name in active_sessions:
            active_sessions[room_name]["participants"] += 1
            active_sessions[room_name]["status"] = "active"
            if "client_identities" not in active_sessions[room_name]:
                active_sessions[room_name]["client_identities"] = []
            active_sessions[room_name]["client_identities"].append(client_identity)

        logger.info(f"Client {client_identity} joining room: {room_name}")

        return {
            "token": token,
            "room_name": room_name,
            "client_identity": client_identity,
            "livekit_url": LIVEKIT_URL,
        }
    except Exception as e:
        logger.error(f"Error joining room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create-session")
async def create_session(
    background_tasks: BackgroundTasks, request: CreateSessionRequest
):
    """Create a new isolated session with unique room and agent for each client"""
    try:
        session_id = str(uuid.uuid4())
        room_name = f"session-{session_id}"

        client_identity = f"client-{session_id}"

        logger.info(f"Creating isolated session: {room_name} for {client_identity}")

        active_sessions[room_name] = {
            "status": "starting",
            "created_at": time.time(),
            "participants": 1,
            "client_identities": [client_identity],
            "session_id": session_id,
            "isolated": True,
        }

        background_tasks.add_task(run_agent_for_room, room_name)

        token = generate_token(client_identity, room_name)

        return {
            "status": "session-created",
            "session_id": session_id,
            "room_name": room_name,
            "client_identity": client_identity,
            "token": token,
            "livekit_url": LIVEKIT_URL,
        }
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/end-session")
async def end_session(request: EndSessionRequest):
    try:
        room_name = request.room_name
        client_identity = request.client_identity

        logger.info(f"Ending session for room: {room_name}, client: {client_identity}")

        if room_name in active_sessions:
            active_sessions[room_name]["participants"] = max(
                0, active_sessions[room_name]["participants"] - 1
            )
            if client_identity and "client_identities" in active_sessions[room_name]:
                active_sessions[room_name]["client_identities"] = [
                    cid
                    for cid in active_sessions[room_name]["client_identities"]
                    if cid != client_identity
                ]
            if active_sessions[room_name]["participants"] == 0:
                active_sessions[room_name]["status"] = "ending"

        return {"status": "session-ended", "room": room_name}
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/session-status/{room_name}")
async def get_session_status(room_name: str):
    try:
        if room_name in active_sessions:
            session_info = active_sessions[room_name].copy()
            session_info["room_name"] = room_name
            session_info["uptime"] = time.time() - session_info["created_at"]
            return session_info
        else:
            return {"status": "not-found", "room_name": room_name}
    except Exception as e:
        logger.error(f"Error getting session status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/active-sessions")
async def get_active_sessions():
    try:
        return {
            "sessions": active_sessions,
            "total_sessions": len(active_sessions),
            "total_participants": sum(
                s.get("participants", 0) for s in active_sessions.values()
            ),
        }
    except Exception as e:
        logger.error(f"Error getting active sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    try:
        context = load_knowledge_context()

        return {
            "status": "healthy",
            "agent": "polymaiths",
            "context_loaded": len(context) > 0,
            "context_size": len(context),
            "approach": "simplified-polymaiths-only",
            "session_management": "persistent-with-monitoring",
        }
    except Exception as e:
        logger.exception("Health check failed")
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT, log_level="info")
