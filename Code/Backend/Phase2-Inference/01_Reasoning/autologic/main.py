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
from .routers import reasoning_router, models_router, history_router, prompts_router
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

setup_logging(log_level=os.getenv("LOG_LEVEL", "INFO"), log_file=str(LOG_FILE))
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
    lifespan=lifespan,
)

# Configuration CORS
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"
).split(",")
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
app.include_router(history_router)
app.include_router(prompts_router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Endpoint de vérification de l'état du service."""
    logger.debug("Health check appelé")
    return {"status": "online", "service": "AutoLogic Engine"}


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Endpoint de health check détaillé."""
    return {"status": "healthy", "version": "0.2.0", "service": "AutoLogic Engine"}


@app.get("/api/help/readme", tags=["help"])
def get_readme() -> dict[str, str]:
    """
    Retourne le contenu du fichier README.md du projet.
    Requiert que le fichier soit à la racine du projet (PROJECT_ROOT).

    Note: Définie comme fonction synchrone (def au lieu de async def) pour que
    FastAPI l'exécute dans un threadpool séparé, évitant de bloquer la boucle
    d'événements principale lors des opérations I/O sur fichier.
    """
    readme_path = PROJECT_ROOT / "README.md"
    logger.info(f"Demande de lecture du README à: {readme_path}")

    if not readme_path.exists():
        logger.error(f"Fichier README introuvable à: {readme_path}")
        return {
            "content": f"# Erreur 404\n\nLe fichier README.md est introuvable à l'emplacement: `{readme_path}`."
        }

    try:
        content = readme_path.read_text(encoding="utf-8")
        logger.info(f"README lu avec succès ({len(content)} octets)")
        return {"content": content}
    except Exception as e:
        logger.error(f"Erreur lors de la lecture du README à {readme_path}: {e}")
        return {
            "content": f"# Erreur 500\n\nImpossible de charger le fichier README.md.\n\nErreur: {str(e)}"
        }


def start() -> None:
    """Fonction helper pour lancer uvicorn."""
    uvicorn.run("autologic.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
