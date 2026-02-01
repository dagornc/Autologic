# Code/Backend/Phase2-Inference/01_Reasoning/tests/test_provider_factory.py
"""
Tests unitaires pour la ProviderFactory.
"""

import pytest
import os
import yaml
from unittest.mock import patch, MagicMock
from pathlib import Path

from autologic.core.provider_factory import ProviderFactory, ProviderType, get_provider_factory
from autologic.core.llm_provider import OpenRouterLLM, OpenAILLM

@pytest.fixture
def clean_env():
    """Reset environment variables."""
    old_env = os.environ.copy()
    yield
    os.environ.clear()
    os.environ.update(old_env)

@pytest.fixture
def mock_config_file(tmp_path):
    """Crée un fichier de config temporaire."""
    config = {
        "llm": {
            "active_provider": "openrouter",
            "active_model": "test-model",
            "temperature": 0.5,
            "providers": {
                "openrouter": {
                    "enabled": True,
                    "default_model": "test-model",
                    "models": ["test-model"]
                },
                "openai": {
                    "enabled": True,
                    "models": ["gpt-4"]
                }
            },
            "resilience": {
                "rate_limit": 10.0,
                "retry_enabled": True
            }
        }
    }
    config_path = tmp_path / "global.yaml"
    with open(config_path, "w") as f:
        yaml.dump(config, f)
    return str(config_path)

class TestProviderFactory:

    def test_singleton(self):
        """Vérifie que get_provider_factory retourne un singleton."""
        f1 = get_provider_factory()
        f2 = get_provider_factory()
        assert f1 is f2

    def test_load_config(self, mock_config_file):
        """Vérifie le chargement de la configuration."""
        factory = ProviderFactory(config_path=mock_config_file)
        assert factory._config["active_provider"] == "openrouter"
        assert factory._config["temperature"] == 0.5

    def test_create_llm_openrouter(self, mock_config_file, clean_env):
        """Vérifie la création d'un LLM OpenRouter."""
        os.environ["OPENROUTER_API_KEY"] = "sk-test"
        factory = ProviderFactory(config_path=mock_config_file)
        
        llm = factory.create_llm()
        assert isinstance(llm, OpenRouterLLM)
        assert llm.model_name == "test-model"

    def test_create_llm_openai(self, mock_config_file, clean_env):
        """Vérifie la création d'un LLM OpenAI explicitement."""
        os.environ["OPENAI_API_KEY"] = "sk-test"
        factory = ProviderFactory(config_path=mock_config_file)
        
        llm = factory.create_llm(provider="openai", model="gpt-4")
        assert isinstance(llm, OpenAILLM)
        assert llm.model_name == "gpt-4"

    def test_create_worker_llm(self, mock_config_file, clean_env):
        """Vérifie la création d'un Worker LLM."""
        os.environ["OPENROUTER_API_KEY"] = "sk-test"
        factory = ProviderFactory(config_path=mock_config_file)
        
        # Test default sharing root settings
        worker = factory.create_worker_llm()
        assert isinstance(worker, OpenRouterLLM)
        # Check if resilience key is correct
        assert worker._resilience_key == "openrouter_worker"

    def test_provider_not_enabled(self, mock_config_file):
        """Vérifie que l'on ne peut pas créer un provider désactivé."""
        factory = ProviderFactory(config_path=mock_config_file)
        # Disable openai
        factory._config["providers"]["openai"]["enabled"] = False
        
        with pytest.raises(ValueError, match="n'est pas activé"):
            factory.create_llm(provider="openai")

    def test_invalid_provider(self, mock_config_file):
        """Vérifie l'erreur pour un provider inconnu."""
        factory = ProviderFactory(config_path=mock_config_file)
        with pytest.raises(ValueError, match="non supporté"):
            factory.create_llm(provider="invalid")

    def test_resilience_config_applied(self, mock_config_file):
        """Vérifie que la config de résilience est appliquée."""
        with patch("autologic.core.resilience.set_resilience_config") as mock_set:
            factory = ProviderFactory(config_path=mock_config_file)
            assert mock_set.called
            # Check calls
            # Can be tricky to check exact calls due to ordering, but we can check call count
            # 5 providers * 3 types (root, worker, audit) = 15 calls
            assert mock_set.call_count >= 5
