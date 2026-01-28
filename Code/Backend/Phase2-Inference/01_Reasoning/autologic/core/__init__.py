# autologic/core/__init__.py
"""
Core components for AutoLogic.
"""

from .models import ReasoningModule, AdaptedModule, ReasoningPlan, ReasoningPlanStep
from .engine import AutoLogicEngine, BaseLLM
from .prompts import PromptTemplates
from .llm_provider import OpenRouterLLM
from .model_registry import ModelRegistry

__all__ = [
    "ReasoningModule",
    "AdaptedModule", 
    "ReasoningPlan",
    "ReasoningPlanStep",
    "AutoLogicEngine",
    "BaseLLM",
    "PromptTemplates",
    "OpenRouterLLM",
    "ModelRegistry",
]
