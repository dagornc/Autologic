# autologic/routers/prompts.py
"""
Router for managing prompts (CRUD operations).
Stores data in a local JSON file for simplicity.
"""

import json
import uuid
from typing import List, Optional
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/prompts", tags=["prompts"])

# --- Configuration ---
# Path to the prompts.json file (relative to project root)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent.parent.parent
PROMPTS_FILE = PROJECT_ROOT / "Config" / "prompts.json"


# --- Models ---
class PromptBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)


class PromptCreate(PromptBase):
    pass


class PromptUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None


class Prompt(PromptBase):
    id: str
    created_at: datetime
    updated_at: datetime


# --- Helpers ---
def _load_prompts() -> List[dict]:
    """Loads prompts from the JSON file."""
    if not PROMPTS_FILE.exists():
        return []
    try:
        with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        logger.error(f"Failed to decode {PROMPTS_FILE}")
        return []
    except Exception as e:
        logger.error(f"Error reading {PROMPTS_FILE}: {e}")
        return []


def _save_prompts(prompts: List[dict]) -> None:
    """Saves prompts to the JSON file."""
    try:
        PROMPTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(PROMPTS_FILE, "w", encoding="utf-8") as f:
            json.dump(prompts, f, indent=2, default=str)
    except Exception as e:
        logger.error(f"Error writing to {PROMPTS_FILE}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save prompts")


# --- Endpoints ---

@router.get("/", response_model=List[Prompt])
async def list_prompts():
    """List all saved prompts."""
    return _load_prompts()


@router.post("/", response_model=Prompt, status_code=status.HTTP_201_CREATED)
async def create_prompt(prompt_in: PromptCreate):
    """Create a new prompt."""
    prompts = _load_prompts()
    
    now = datetime.utcnow().isoformat()
    new_prompt = {
        "id": str(uuid.uuid4()),
        "title": prompt_in.title,
        "content": prompt_in.content,
        "tags": prompt_in.tags,
        "created_at": now,
        "updated_at": now,
    }
    
    prompts.append(new_prompt)
    _save_prompts(prompts)
    
    logger.info(f"Created prompt: {new_prompt['id']}")
    return new_prompt


@router.put("/{prompt_id}", response_model=Prompt)
async def update_prompt(prompt_id: str, prompt_in: PromptUpdate):
    """Update an existing prompt."""
    prompts = _load_prompts()
    
    for i, p in enumerate(prompts):
        if p["id"] == prompt_id:
            updated_p = p.copy()
            
            if prompt_in.title is not None:
                updated_p["title"] = prompt_in.title
            if prompt_in.content is not None:
                updated_p["content"] = prompt_in.content
            if prompt_in.tags is not None:
                updated_p["tags"] = prompt_in.tags
            
            updated_p["updated_at"] = datetime.utcnow().isoformat()
            
            prompts[i] = updated_p
            _save_prompts(prompts)
            
            logger.info(f"Updated prompt: {prompt_id}")
            return updated_p
            
    raise HTTPException(status_code=404, detail="Prompt not found")


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(prompt_id: str):
    """Delete a prompt."""
    prompts = _load_prompts()
    
    initial_len = len(prompts)
    prompts = [p for p in prompts if p["id"] != prompt_id]
    
    if len(prompts) == initial_len:
        raise HTTPException(status_code=404, detail="Prompt not found")
        
    _save_prompts(prompts)
    logger.info(f"Deleted prompt: {prompt_id}")
    return None
