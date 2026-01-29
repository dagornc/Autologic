# autologic/routers/reasoning.py
"""
Routes FastAPI pour les endpoints de raisonnement.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from ..utils.logging_config import get_logger
from ..core.engine import AutoLogicEngine

logger = get_logger(__name__)

router = APIRouter(prefix="/reason", tags=["reasoning"])


class TaskRequest(BaseModel):
    """Requête pour soumettre une tâche de raisonnement."""

    task: str = Field(..., min_length=1, description="La tâche à résoudre")
    parameters: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Paramètres optionnels (provider, model)"
    )


class TaskResponse(BaseModel):
    """Réponse du cycle de raisonnement complet."""

    task: str
    plan: Dict[str, Any]
    final_output: str


class ErrorResponse(BaseModel):
    """Réponse en cas d'erreur."""

    error: str


# Dépendance pour l'injection du moteur (sera configurée dans main.py)
_engine_instance: Optional[AutoLogicEngine] = None


def get_engine() -> AutoLogicEngine:
    """Récupère l'instance du moteur AutoLogic."""
    if _engine_instance is None:
        raise HTTPException(status_code=503, detail="AutoLogic Engine not initialized")
    return _engine_instance


def set_engine(engine: AutoLogicEngine) -> None:
    """Configure l'instance du moteur AutoLogic."""
    global _engine_instance
    _engine_instance = engine


@router.post("/full", response_model=TaskResponse, responses={500: {"model": ErrorResponse}})
async def solve_task(request: TaskRequest, engine: AutoLogicEngine = Depends(get_engine)) -> Dict[str, Any]:
    """
    Exécute le cycle complet Self-Discover sur une tâche.

    - **task**: La tâche ou problème à résoudre
    - **parameters**: Paramètres optionnels (provider, model pour le LLM)

    Returns:
        Le plan de raisonnement et la solution finale
    """
    logger.info(f"Résolution de tâche: {request.task[:100]}...")

    try:
        # Récupérer les paramètres ou utiliser la config active par défaut
        params = request.parameters or {}
        override_provider = params.get("provider")
        override_model = params.get("model")

        # Factory et imports
        from ..core.provider_factory import get_provider_factory

        factory = get_provider_factory()

        # Options communes (peuvent être None)
        common_kwargs = {
            k: v
            for k, v in {
                "api_key": params.get("api_key"),
                "temperature": params.get("temperature"),
                "max_tokens": params.get("max_tokens"),
                "timeout": params.get("timeout"),
            }.items()
            if v is not None
        }

        # Logique d'instanciation
        if override_provider or override_model:
            # Cas Override : on utilise le même modèle pour tout (mode legacy/test)
            logger.info(f"Override détecté : Root & Worker utilisent {override_provider}/{override_model}")
            root_llm = factory.create_llm(provider=override_provider, model=override_model, **common_kwargs)
            worker_llm = factory.create_llm(provider=override_provider, model=override_model, **common_kwargs)
        else:
            # Cas Configuration Dual (Root != Worker)
            logger.info("Utilisation de la configuration Dual (Root/Worker)")

            # Root LLM (Stratégique: Select, Adapt, Structure)
            root_llm = factory.create_llm(**common_kwargs)

            # Worker LLM (Tactique: Execute)
            worker_llm = factory.create_worker_llm(**common_kwargs)

        logger.info(f"Cycle configuré -> Root: {root_llm.model_name} | Worker: {worker_llm.model_name}")

        # Exécution du cycle avec les deux LLMs
        result = await engine.run_full_cycle(request.task, root_llm=root_llm, worker_llm=worker_llm)

        if "error" in result:
            logger.error(f"Erreur cycle: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])

        logger.info("Tâche résolue avec succès")
        return result

    except ValueError as e:
        logger.error(f"Erreur configuration: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Erreur inattendue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/modules")
async def list_modules(engine: AutoLogicEngine = Depends(get_engine)) -> Dict[str, Any]:
    """
    Liste tous les modules de raisonnement disponibles.

    Returns:
        Liste des 39 modules de raisonnement avec leurs métadonnées
    """
    return {"modules": [m.to_dict() for m in engine.reasoning_modules]}
