
# SONIC AI Voice Agent

SONIC is a passionate, ongoing project focused on developing an intelligent voice agent that can engage in highly human-like conversations. Built with cutting-edge technologies such as LiveKit, LangGraph, and open-source language models, SONIC aims to push the boundaries of voice-based interaction and deliver a seamless, lifelike user experience.

## Features

• Natural, human-like speech synthesis and understanding
• Real-time voice interactions with lowest latency
• Modular integration using LiveKit, Deepgram, LangGraph etc
• Scalable architecture for deploying custom voice agents
• Multi-agent support with different personalities and use cases
• Speed-to-lead automation with Twilio integration
• Configurable CORS and environment-based deployments

## Quick Start

### 2. Configure API Keys

Edit `backend/.env` and add your API keys:
- LiveKit credentials
- Deepgram API key
- OpenAI API key  
- Groq API key
- (Optional) Twilio credentials for speed-to-lead

### 3. Install Dependencies

Backend:
```bash
cd backend
pip install -r requirements.txt
```

Frontend:
```bash
cd frontend
npm install
```

### 4. Run the Application

Backend:
```bash
python main.py
```

Frontend:
```bash
cd frontend
npm install 
npm run build
npm run dev
```

## Environment Configuration

For detailed environment setup instructions, see [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md).

### Key Environment Variables

**Backend:**
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `BACKEND_PORT`: Port for the backend server
- `PUBLIC_URL`: Public URL for webhook callbacks

**Frontend:**
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Deployment

The application is designed to be easily deployable with environment-based configuration:

- **Development**: `http://localhost:3000` (backend), `http://localhost:8000` (frontend)
- **Production**: Configure `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL` for your domain

## Architecture

- **Backend**: FastAPI with LiveKit integration
- **Frontend**: Next.js with React and Tailwind CSS  
- **AI Services**: Deepgram (STT), OpenAI (TTS), Groq (LLM)
- **Voice Processing**: LiveKit WebRTC
- **Storage**: Local JSON files (easily extensible)

## Troubleshooting

### "Backend connection fail" Error
1. Ensure backend server is running
2. Check `CORS_ORIGINS` includes your frontend domain
3. Verify `NEXT_PUBLIC_API_URL` points to correct backend

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed troubleshooting.