# autologic/routers/history.py
"""
Router for managing conversation history.
Stores and retrieves conversation logs (Task, Plan, Solution) from the filesystem.
"""

import json
import uuid
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/history", tags=["history"])

# Configuration du stockage (Relatif au package autologic)
# On remonte de 2 niveaux (routers -> autologic -> 01_Reasoning) puis on va dans history
HISTORY_DIR = Path(__file__).parent.parent.parent / "history"
HISTORY_DIR.mkdir(parents=True, exist_ok=True)


class HistoryItem(BaseModel):
    """Modèle complet d'un objet historique."""

    id: str
    timestamp: str
    task: str
    plan: Dict[str, Any]
    final_output: str


class CreateHistoryRequest(BaseModel):
    """Requête de création d'historique."""

    task: str
    plan: Dict[str, Any]
    final_output: str


@router.get("/", response_model=List[HistoryItem])
async def list_history(limit: int = 50, offset: int = 0):
    """
    Liste l'historique des conversations triées par date décroissante.
    """
    try:
        files = sorted(HISTORY_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)

        history_list = []
        # Appliquer la pagination sur les fichiers
        paginated_files = files[offset : offset + limit]

        for file_path in paginated_files:
            try:
                data = json.loads(file_path.read_text(encoding="utf-8"))
                # On valide que le fichier contient bien les champs requis
                if "id" in data and "timestamp" in data:
                    history_list.append(data)
            except Exception as e:
                logger.warning(
                    f"Impossible de lire le fichier historique {file_path}: {e}"
                )
                continue

        return history_list

    except Exception as e:
        logger.error(f"Erreur lors du listing de l'historique: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{item_id}", response_model=HistoryItem)
async def get_history_item(item_id: str):
    """
    Récupère un élément d'historique spécifique par son ID.
    """
    file_path = HISTORY_DIR / f"{item_id}.json"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Historique non trouvé")

    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
        return data
    except Exception as e:
        logger.error(f"Erreur lecture historique {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lecture fichier")


@router.post("/", response_model=HistoryItem)
async def save_history(item: CreateHistoryRequest):
    """
    Sauvegarde une nouvelle conversation dans l'historique.
    """
    try:
        # Génération des métadonnées
        item_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        history_data = {
            "id": item_id,
            "timestamp": timestamp,
            "task": item.task,
            "plan": item.plan,
            "final_output": item.final_output,
        }

        # Sauvegarde fichier
        file_path = HISTORY_DIR / f"{item_id}.json"

        # Validation Pydantic avant écriture pour être sûr
        validated_item = HistoryItem(**history_data)  # type: ignore

        file_path.write_text(
            json.dumps(validated_item.model_dump(), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        logger.info(f"Historique sauvegardé: {item_id}")
        return validated_item

    except Exception as e:
        logger.error(f"Erreur sauvegarde historique: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}")
async def delete_history_item(item_id: str):
    """
    Supprime un élément d'historique.
    """
    file_path = HISTORY_DIR / f"{item_id}.json"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Historique non trouvé")

    try:
        file_path.unlink()
        logger.info(f"Historique supprimé: {item_id}")
        return {"status": "success", "message": "Historique supprimé"}
    except Exception as e:
        logger.error(f"Erreur suppression historique {item_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Impossible de supprimer le fichier"
        )
