# Test/conftest.py
"""
Configuration pytest et fixtures partagées pour AutoLogic.
"""

import sys
from pathlib import Path

import pytest

# Ajouter le chemin du backend au PYTHONPATH
BACKEND_PATH = Path(__file__).parent.parent / "Code" / "Backend" / "Phase2-Inference" / "01_Reasoning"
sys.path.insert(0, str(BACKEND_PATH))


@pytest.fixture
def sample_task() -> str:
    """Fixture pour une tâche de test standard."""
    return "Analyse les données et propose une solution optimale."


@pytest.fixture
def sample_config() -> dict[str, str]:
    """Fixture pour une configuration de test."""
    return {
        "provider": "openrouter",
        "model": "google/gemini-2.0-flash-exp:free"
    }
