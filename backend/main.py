import os
import sys
import signal
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend directory
backend_env_path = Path(__file__).parent / "backend" / ".env"
if backend_env_path.exists():
    load_dotenv(backend_env_path)
else:
    # Fallback to root directory .env
    load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler("app.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("production-server")

def signal_handler(sig, frame):
    logger.info("Received shutdown signal, exiting gracefully...")
    sys.exit(0)

# Handle signals
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def check_required_env_vars():
    """Check if required environment variables are set"""
    required_vars = [
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "LIVEKIT_URL",
        "DEEPGRAM_KEY",
        "GOOGLE_API_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please check your backend/.env file and ensure all required variables are set")
        logger.error("Run './setup-env.sh' to create environment files from templates")
        return False
    
    return True

if __name__ == "__main__":
    try:
        logger.info("Starting Esmagico AI Voice Agent production server...")
        
        # Check environment variables
        if not check_required_env_vars():
            sys.exit(1)
        
        # Get port from environment variables (consistent with backend/server.py)
        # Priority: PORT (deployment platforms) > BACKEND_PORT (our config) > default
        port = int(os.environ.get("PORT", os.environ.get("BACKEND_PORT", "3000")))
        
        # Log configuration
        cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000")
        logger.info(f"Server starting on port: {port}")
        logger.info(f"CORS origins: {cors_origins}")
        
        # Import and run the FastAPI app directly
        from backend.server import app
        import uvicorn
        
        uvicorn.run(
            app,  # Pass app object directly, not string
            host="0.0.0.0",
            port=port,
            reload=False,
            access_log=True,
            log_level="info"
        )
        
    except ImportError as e:
        logger.error(f"Import error: {e}")
        logger.error("Make sure all dependencies are installed: pip install -r backend/requirements.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Server error: {e}")
        logger.exception("Full error traceback:")
        sys.exit(1)
