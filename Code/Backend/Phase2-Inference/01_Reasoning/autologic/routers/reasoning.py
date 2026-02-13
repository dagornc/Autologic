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
    from ..services.reasoning_service import ReasoningService
    service = ReasoningService()
    
    try:
        result = await service.execute_task(request.task, request.parameters or {})
        
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])
             
        return result
    except Exception as e:
        logger.exception(f"Error in solve_task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        # Instantiate Service
        from ..services.reasoning_service import ReasoningService
        service = ReasoningService()

        # Launch task in background
        task_future = asyncio.create_task(
            service.execute_task(request.task, request.parameters or {}, progress_listener)
        )

        try:
            while not task_future.done():
                try:
                    # Wait for event or task completion
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


@router.get("/modules")
async def list_modules(engine: AutoLogicEngine = Depends(get_engine)) -> Dict[str, Any]:
    """
    Liste tous les modules de raisonnement disponibles.

    Returns:
        Liste des modules de raisonnement avec leurs métadonnées
    """
    return {"modules": [m.to_dict() for m in engine.reasoning_modules]}

