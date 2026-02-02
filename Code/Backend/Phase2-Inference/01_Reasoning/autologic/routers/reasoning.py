# autologic/routers/reasoning.py
"""
Routes FastAPI pour les endpoints de raisonnement.
"""

import asyncio
import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

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
    reasoning_modes: Optional[List[str]] = Field(default_factory=list)


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


@router.post(
    "/full", response_model=TaskResponse, responses={500: {"model": ErrorResponse}}
)
async def solve_task(
    request: TaskRequest, engine: AutoLogicEngine = Depends(get_engine)
) -> Dict[str, Any]:
    """
    Exécute le cycle complet Self-Discover sur une tâche.
    Legacy synchronous endpoint.
    """
    return await _run_task_logic(request, engine)


@router.post("/stream")
async def solve_task_stream(
    request: TaskRequest, engine: AutoLogicEngine = Depends(get_engine)
):
    """
    Exécute le cycle complet et stream la progression via SSE.
    """
    logger.info(f"Streaming task resolution: {request.task[:100]}...")

    q: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()

    async def progress_listener(event):
        await q.put(event)

    async def event_generator():
        # Lancer la tâche en background
        task_future = asyncio.create_task(
            _run_task_logic(request, engine, progress_listener)
        )

        try:
            while not task_future.done():
                try:
                    # Wait for event or task completion
                    # Uses a short timeout to check task status periodically
                    event = await asyncio.wait_for(q.get(), timeout=0.1)
                    
                    data = json.dumps(event)
                    yield f"data: {data}\n\n"
                    
                except asyncio.TimeoutError:
                    continue
            
            # Check for result or exception
            try:
                result = await task_future
                # Final result event
                yield f"data: {json.dumps({'type': 'result', 'payload': result})}\n\n"
            except Exception as e:
                # Error event
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        
        except asyncio.CancelledError:
            logger.warning(f"Task resolution cancelled by client for: {request.task[:50]}...")
            task_future.cancel()
            raise

    return StreamingResponse(event_generator(), media_type="text/event-stream")


async def _run_task_logic(
    request: TaskRequest,
    engine: AutoLogicEngine,
    callback=None
) -> Dict[str, Any]:
    """Reused logic for task execution."""
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
                "retry_enabled": params.get("retry_enabled"),
                "max_retries": params.get("max_retries"),
                "fallback_enabled": params.get("fallback_enabled"),
                "retry_base_delay": params.get("retry_base_delay"),
                "rate_limit": params.get("rate_limit"),
            }.items()
            if v is not None
        }

        # Construct specific kwargs for Root, Worker, Audit
        root_resilience = {
            "rate_limit": params.get("rateLimit"),
            "retry_enabled": params.get("retryEnabled"),
            "fallback_enabled": params.get("fallbackEnabled")
        }
        root_kwargs = {**common_kwargs, **{k: v for k, v in root_resilience.items() if v is not None}}

        worker_resilience = {
            "rate_limit": params.get("workerRateLimit"),
            "retry_enabled": params.get("workerRetryEnabled"),
            "fallback_enabled": params.get("workerFallbackEnabled")
        }
        worker_kwargs = {**common_kwargs, **{k: v for k, v in worker_resilience.items() if v is not None}}

        audit_resilience = {
            "rate_limit": params.get("auditRateLimit"),
            "retry_enabled": params.get("auditRetryEnabled"),
            "fallback_enabled": params.get("auditFallbackEnabled")
        }
        audit_kwargs = {**common_kwargs, **{k: v for k, v in audit_resilience.items() if v is not None}}

        # Logique d'instanciation
        if override_provider or override_model:
            # Cas Override : on utilise le même modèle pour tout (mode legacy/test)
            logger.info(
                f"Override détecté : Root & Worker & Audit utilisent {override_provider}/{override_model}"
            )
            root_llm = factory.create_llm(
                provider=override_provider, model=override_model, **common_kwargs
            )
            worker_llm = factory.create_llm(
                provider=override_provider, model=override_model, **common_kwargs
            )
            audit_llm = factory.create_llm(
                provider=override_provider, model=override_model, **common_kwargs
            )
        else:
            # Cas Configuration Dual (Root != Worker != Audit)
            logger.info(
                "Utilisation de la configuration Multi-Agent (Root/Worker/Audit)"
            )

            # Root LLM (Stratégique: Select, Adapt, Structure)
            root_llm = factory.create_llm(**root_kwargs)

            # Worker LLM (Tactique: Execute)
            worker_llm = factory.create_worker_llm(**worker_kwargs)

            # Audit LLM (Observer: Critique)
            audit_llm = factory.create_audit_llm(**audit_kwargs)

        logger.info(
            f"Cycle configuré -> Root: {root_llm.model_name} | Worker: {worker_llm.model_name} | Audit: {audit_llm.model_name}"
        )

        # Config Engine with callback if provided
        local_engine = AutoLogicEngine(
            root_model=root_llm,
            worker_model=worker_llm,
            audit_model=audit_llm,
            progress_callback=callback
        )

        # Exécution du cycle avec les trois LLMs
        audit_timeout = (
            params.get("audit_timeout") or factory._config.get("audit_timeout") or 30
        )
        audit_max_retries = params.get("audit_max_retries") or factory._config.get(
            "audit_max_retries", 3
        )

        result = await local_engine.run_full_cycle(
            request.task,
            root_llm=root_llm,
            worker_llm=worker_llm,
            audit_llm=audit_llm,
            audit_timeout=int(audit_timeout),
            audit_max_retries=int(audit_max_retries),
        )

        if "error" in result:
            logger.error(f"Erreur cycle: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])

        logger.info("Tâche résolue avec succès")
        if callback:
            # Drain queue
            pass

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
        Liste des modules de raisonnement avec leurs métadonnées
    """
    return {"modules": [m.to_dict() for m in engine.reasoning_modules]}
