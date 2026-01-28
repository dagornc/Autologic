
# Code/Backend/Phase2-Inference/01_Reasoning/tests/test_models_router.py
"""
Tests unitaires pour les endpoints du router models.
"""

import pytest
from fastapi.testclient import TestClient
from autologic.main import app
from autologic.core.provider_factory import get_provider_factory, ProviderType

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_factory():
    """Reset provider factory state before each test."""
    factory = get_provider_factory()
    # Reset to defaults with providers config
    factory._config = {
        "active_provider": "openrouter",
        "active_model": "google/gemini-2.0-flash-exp:free",
        "temperature": 0.7,
        "max_tokens": 4096,
        "providers": {
            "openrouter": {
                "enabled": True,
                "models": ["google/gemini-2.0-flash-exp:free", "anthropic/claude-3-opus"]
            },
            "openai": {
                "enabled": True,
                "models": ["gpt-4-turbo", "gpt-3.5-turbo"]
            }
        }
    }
    yield

class TestModelsRouter:
    """Tests pour les endpoints /api/models et /api/providers/*."""

    def test_list_models(self):
        """Test GET /api/models."""
        response = client.get("/api/models")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "models" in data
        assert "OpenRouter" in data["providers"]
        assert "OpenAI" in data["providers"]
        # Check structure of models
        assert isinstance(data["models"], dict)
        assert "OpenRouter" in data["models"]

    def test_get_providers_config(self):
        """Test GET /api/providers/config."""
        response = client.get("/api/providers/config")
        assert response.status_code == 200
        data = response.json()
        assert data["active_provider"] == "openrouter"
        assert data["temperature"] == 0.7

    def test_update_providers_config_success(self):
        """Test POST /api/providers/config (Success case)."""
        payload = {
            "provider": "OpenAI",
            "model": "gpt-4-turbo",
            "temperature": 0.5,
            "max_tokens": 2048
        }
        response = client.post("/api/providers/config", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        # Verify update
        check = client.get("/api/providers/config")
        data = check.json()
        assert data["active_provider"] == "openai"
        assert data["active_model"] == "gpt-4-turbo"
        assert data["temperature"] == 0.5
        assert data["max_tokens"] == 2048

    def test_update_providers_config_invalid_provider(self):
        """Test POST /api/providers/config (Invalid provider)."""
        payload = {
            "provider": "InvalidProvider",
            "model": "gpt-4",
        }
        response = client.post("/api/providers/config", json=payload)
        assert response.status_code == 400
        assert "non supporté" in response.json()["detail"]

    def test_get_providers_status(self):
        """Test GET /api/providers/status."""
        response = client.get("/api/providers/status")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert isinstance(data["providers"], list)
        
        # Check basic structure of a provider status
        first = data["providers"][0]
        assert "name" in first
        assert "enabled" in first
        assert "available" in first

    def test_get_provider_models_success(self):
        """Test GET /api/providers/{provider}/models."""
        # Using OpenAI as it typically has a static list in registry if no API call
        response = client.get("/api/providers/OpenAI/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) > 0

    def test_get_provider_models_invalid(self):
        """Test GET /api/providers/{provider}/models with invalid provider."""
        response = client.get("/api/providers/DoesNotExist/models")
        assert response.status_code == 400

    def test_verify_provider_connection_success(self):
        """Test POST /api/providers/verify (Success)."""
        # Mocking or using a provider that doesn't strictly need a key for basic check if possible, 
        # but here we rely on the fact that we can mock the behavior if needed, 
        # or use a provider like Ollama if available. 
        # For unit testing without external calls, we usually mock the provider method.
        # But since we are strictly testing the router logic:
        
        # We'll use a mocked provider_factory or monkeypatch logic if we were strictly unit testing internals.
        # However, with TestClient(app), we are doing integration tests.
        # Let's try to verify "Ollama" assuming it might be reachable or we mock it.
        # BETTER STRATEGY: We will mock the `list_models` method of the OpenRouterLLM class 
        # to return success/fail without actual network call using pytest.monkeypatch seems tricky with TestClient directly unless we patch imports.

        # Let's patch `autologic.core.llm_provider.OpenRouterLLM.list_models`
        from unittest.mock import AsyncMock, patch
        
        with patch("autologic.core.llm_provider.OpenRouterLLM.list_models", new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ["model1", "model2"]
            
            payload = {
                "provider": "OpenRouter",
                "api_key": "sk-test-key"
            }
            response = client.post("/api/providers/verify", json=payload)
            assert response.status_code == 200
            assert response.json()["status"] == "success"
            mock_list.assert_called_once()

    def test_verify_provider_connection_failure(self):
        """Test POST /api/providers/verify (Failure)."""
        from unittest.mock import AsyncMock, patch
        
        with patch("autologic.core.llm_provider.OpenRouterLLM.list_models", new_callable=AsyncMock) as mock_list:
            # Simulate an error (e.g. 401 Unauthorized moved to exception)
            mock_list.side_effect = ValueError("Invalid API Key")
            
            payload = {
                "provider": "OpenRouter",
                "api_key": "sk-invalid-key"
            }
            response = client.post("/api/providers/verify", json=payload)
            assert response.status_code == 400
            assert "Invalid API Key" in response.json()["detail"]

    def test_verify_provider_invalid(self):
        """Test POST /api/providers/verify with invalid provider name."""
        payload = {
            "provider": "NonExistentProvider",
            "api_key": "sk-test"
        }
        response = client.post("/api/providers/verify", json=payload)
        assert response.status_code == 400
        assert "non supporté" in response.json()["detail"]
