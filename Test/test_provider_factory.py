# Tests pour le système multi-provider LLM
"""
Tests unitaires pour provider_factory, llm_provider et endpoints.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import os
import sys

# Ajouter le chemin du backend au PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'Code', 'Backend', 'Phase2-Inference', '01_Reasoning'))

from autologic.core.provider_factory import (
    ProviderFactory,
    ProviderType,
    get_provider_factory,
)


class TestProviderType:
    """Tests pour l'enum ProviderType."""
    
    def test_all_providers_defined(self) -> None:
        """Vérifie que tous les providers attendus sont définis."""
        expected = {'openrouter', 'openai', 'ollama', 'vllm', 'huggingface'}
        actual = {p.value for p in ProviderType}
        assert actual == expected
    
    def test_provider_from_string(self) -> None:
        """Vérifie la conversion string -> enum."""
        assert ProviderType('openrouter') == ProviderType.OPENROUTER
        assert ProviderType('ollama') == ProviderType.OLLAMA


class TestProviderFactory:
    """Tests pour la factory de providers."""
    
    @pytest.fixture
    def mock_config_file(self, tmp_path) -> str:
        """Crée un fichier de config temporaire."""
        config_content = """
llm:
  active_provider: "openrouter"
  active_model: "test-model"
  temperature: 0.5
  providers:
    openrouter:
      enabled: true
      default_model: "test-model"
      models:
        - "test-model"
        - "other-model"
    openai:
      enabled: false
      models: []
    ollama:
      enabled: true
      models:
        - "llama3"
"""
        config_file = tmp_path / "test_config.yaml"
        config_file.write_text(config_content)
        return str(config_file)
    
    def test_factory_loads_config(self, mock_config_file: str) -> None:
        """Vérifie que la factory charge la configuration."""
        factory = ProviderFactory(config_path=mock_config_file)
        assert factory.get_active_provider() == "openrouter"
        assert factory.get_active_model() == "test-model"
    
    def test_get_available_providers(self, mock_config_file: str) -> None:
        """Vérifie la liste des providers avec leur état."""
        factory = ProviderFactory(config_path=mock_config_file)
        providers = factory.get_available_providers()
        
        assert providers['openrouter'] is True
        assert providers['openai'] is False
        assert providers['ollama'] is True
    
    def test_get_models_for_provider(self, mock_config_file: str) -> None:
        """Vérifie la récupération des modèles par provider."""
        factory = ProviderFactory(config_path=mock_config_file)
        
        models = factory.get_models_for_provider('openrouter')
        assert 'test-model' in models
        assert 'other-model' in models
    
    def test_is_provider_enabled(self, mock_config_file: str) -> None:
        """Vérifie la méthode is_provider_enabled."""
        factory = ProviderFactory(config_path=mock_config_file)
        
        assert factory.is_provider_enabled('openrouter') is True
        assert factory.is_provider_enabled('openai') is False
    
    def test_create_llm_invalid_provider(self, mock_config_file: str) -> None:
        """Vérifie l'erreur pour un provider invalide."""
        factory = ProviderFactory(config_path=mock_config_file)
        
        with pytest.raises(ValueError, match="non supporté"):
            factory.create_llm(provider="invalid_provider")
    
    def test_create_llm_disabled_provider(self, mock_config_file: str) -> None:
        """Vérifie l'erreur pour un provider désactivé."""
        factory = ProviderFactory(config_path=mock_config_file)
        
        with pytest.raises(ValueError, match="n'est pas activé"):
            factory.create_llm(provider="openai")


class TestProviderFactorySingleton:
    """Tests pour le singleton de la factory."""
    
    def test_singleton_returns_same_instance(self) -> None:
        """Vérifie que get_provider_factory retourne la même instance."""
        # Reset singleton for test
        import autologic.core.provider_factory as pf
        pf._factory_instance = None
        
        factory1 = get_provider_factory()
        factory2 = get_provider_factory()
        
        assert factory1 is factory2


class TestLLMProviders:
    """Tests pour les classes de providers LLM."""
    
    def test_openrouter_requires_api_key(self) -> None:
        """Vérifie que OpenRouterLLM requiert une clé API."""
        from autologic.core.llm_provider import OpenRouterLLM
        
        # Clear env var
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}):
            with pytest.raises(ValueError, match="Clé API"):
                OpenRouterLLM(model_name="test-model")
    
    def test_openai_requires_api_key(self) -> None:
        """Vérifie que OpenAILLM requiert une clé API."""
        from autologic.core.llm_provider import OpenAILLM
        
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            with pytest.raises(ValueError, match="Clé API"):
                OpenAILLM(model_name="gpt-4")
    
    def test_huggingface_requires_api_key(self) -> None:
        """Vérifie que HuggingFaceLLM requiert une clé API."""
        from autologic.core.llm_provider import HuggingFaceLLM
        
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            with pytest.raises(ValueError, match="Clé API"):
                HuggingFaceLLM(model_name="meta-llama/Llama-2-7b")
    
    def test_ollama_no_api_key_required(self) -> None:
        """Vérifie qu'OllamaLLM ne requiert pas de clé API."""
        from autologic.core.llm_provider import OllamaLLM
        
        # Should not raise
        with patch('autologic.core.llm_provider.ChatOpenAI'):
            llm = OllamaLLM(model_name="llama3")
            assert llm.provider_name == "ollama"


@pytest.mark.asyncio
class TestOllamaModelDetection:
    """Tests asynchrones pour la détection de modèles Ollama."""
    
    async def test_list_models_success(self) -> None:
        """Teste la détection de modèles Ollama."""
        from autologic.core.llm_provider import OllamaLLM
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'models': [
                {'name': 'llama3'},
                {'name': 'mistral'},
            ]
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            models = await OllamaLLM.list_models()
            assert 'llama3' in models
            assert 'mistral' in models
    
    async def test_list_models_connection_error(self) -> None:
        """Teste la gestion d'erreur de connexion."""
        from autologic.core.llm_provider import OllamaLLM
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get = AsyncMock(side_effect=Exception("Connection refused"))
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            models = await OllamaLLM.list_models()
            assert models == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
