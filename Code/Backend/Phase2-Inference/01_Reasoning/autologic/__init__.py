# autologic/__init__.py
"""
AutoLogic - Self-Discover Reasoning Framework
"""

from .core import (
    AutoLogicEngine,
    BaseLLM,
    ReasoningModule,
    AdaptedModule,
    ReasoningPlan,
    OpenRouterLLM,
)

__version__ = "0.2.0"
__all__ = [
    "AutoLogicEngine",
    "BaseLLM",
    "ReasoningModule",
    "AdaptedModule",
    "ReasoningPlan",
    "OpenRouterLLM",
]
