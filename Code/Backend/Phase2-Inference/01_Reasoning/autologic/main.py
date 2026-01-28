# autologic/main.py
"""
Point d'entrée principal de l'API AutoLogic.
Configuration et démarrage du serveur FastAPI.
"""

import os
import uvicorn
from pathlib import Path
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .core.engine import AutoLogicEngine
from .core.llm_provider import OpenRouterLLM
from .routers import reasoning_router, models_router
from .routers.reasoning import set_engine
from .utils.logging_config import setup_logging, get_logger

# Charger les variables d'environnement depuis la racine du projet
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
load_dotenv(ENV_FILE, override=True)

# Configuration du logging
LOG_DIR = Path(__file__).parent.parent.parent.parent.parent / "Log"
LOG_FILE = LOG_DIR / "backend_app.log"
LOG_DIR.mkdir(parents=True, exist_ok=True)

setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_file=str(LOG_FILE)
)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Gestion du cycle de vie de l'application.
    Initialise le moteur au démarrage.
    """
    logger.info("Démarrage de l'application AutoLogic")
    
    try:
        # Initialisation du LLM
        root_llm = OpenRouterLLM(model_name="meta-llama/llama-3.3-70b-instruct:free")
        worker_llm = OpenRouterLLM(model_name="meta-llama/llama-3.3-70b-instruct:free")
        
        # Initialisation du moteur
        engine = AutoLogicEngine(root_model=root_llm, worker_model=worker_llm)
        set_engine(engine)
        
        logger.info("AutoLogic Engine initialisé avec succès")
        
    except Exception as e:
        logger.error(f"Échec d'initialisation: {e}")
        # Le moteur sera None, les endpoints retourneront 503
    
    yield
    
    logger.info("Arrêt de l'application AutoLogic")


# --- Application FastAPI ---
app = FastAPI(
    title="AutoLogic Engine API",
    description="API for the Self-Discover Reasoning Framework",
    version="0.2.0",
    lifespan=lifespan
)

# Configuration CORS
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des routers
app.include_router(reasoning_router)
app.include_router(models_router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Endpoint de vérification de l'état du service."""
    logger.debug("Health check appelé")
    return {"status": "online", "service": "AutoLogic Engine"}


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Endpoint de health check détaillé."""
    return {
        "status": "healthy",
        "version": "0.2.0",
        "service": "AutoLogic Engine"
    }


def start() -> None:
    """Fonction helper pour lancer uvicorn."""
    uvicorn.run(
        "autologic.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )


if __name__ == "__main__":
    start()
