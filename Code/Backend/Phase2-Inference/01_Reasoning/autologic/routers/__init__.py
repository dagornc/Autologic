# autologic/routers/__init__.py
"""
Routers FastAPI pour AutoLogic.
"""

from .reasoning import router as reasoning_router
from .models import router as models_router
from .history import router as history_router
from .prompts import router as prompts_router

__all__ = ["reasoning_router", "models_router", "history_router", "prompts_router"]
