import pytest
import os
from unittest.mock import MagicMock, patch
from autologic.core.provider_factory import ProviderFactory, ProviderType
from autologic.core.resilience import get_resilience_config, set_resilience_config, ResilienceConfig

class TestResilienceIntegration:
    """Test integration of resilience configuration in ProviderFactory."""

    def setup_method(self):
        # Reset singleton state before each test
        # We need to access the module-level dictionaries in resilience.py
        # Since we can't easily reset module state, we'll patch get_resilience_config 
        # or just ensure our factory overrides everything.
        pass

    @patch('autologic.core.provider_factory.yaml.safe_load')
    @patch('builtins.open')
    def test_worker_resilience_inheritance(self, mock_open, mock_yaml):
        """
        Verify that worker and audit agents inherit the global resilience configuration.
        """
        # 1. Setup Mock Config
        mock_config = {
            "llm": {
                "active_provider": "openrouter",
                "resilience": {
                    "rate_limit": 99.0,  # Distinct value
                    "retry_enabled": True,
                    "max_retries": 5
                }
            }
        }
        mock_yaml.return_value = mock_config
        
        # 2. Initialize Factory
        # This triggers _apply_resilience_config
        factory = ProviderFactory(config_path="dummy_path")
        
        # 3. Verify Base Provider Config
        base_config = get_resilience_config("openrouter")
        assert base_config.rate_limit == 99.0
        assert base_config.max_retries == 5
        
        # 4. Verify Worker Config (The Bug Fix)
        worker_config = get_resilience_config("openrouter_worker")
        assert worker_config.rate_limit == 99.0, "Worker config should inherit global rate limit"
        
        # 5. Verify Audit Config
        audit_config = get_resilience_config("openrouter_audit")
        assert audit_config.rate_limit == 99.0, "Audit config should inherit global rate limit"

    @patch('autologic.core.provider_factory.yaml.safe_load')
    @patch('builtins.open')
    def test_provider_specific_factory_logic(self, mock_open, mock_yaml):
        """Verify factory logic for standard provider creation."""
        mock_config = {
            "llm": {
                "active_provider": "openrouter",
                "providers": {
                    "openrouter": {
                        "enabled": True,
                    },
                    "openai": { # distinct provider
                        "enabled": True,
                        "default_model": "test-model-openai"
                    }
                }
            }
        }
        mock_yaml.return_value = mock_config
        
        factory = ProviderFactory(config_path="dummy_path")
        
        # Create LLM for a NON-active provider (openai) to ensure it uses provider's default_model
        # We need to mock ChatOpenAI to avoid actual network calls
        with patch('autologic.core.llm_provider.ChatOpenAI'), \
             patch.dict(os.environ, {"OPENAI_API_KEY": "sk-mock-key"}):
            llm = factory.create_llm(provider="openai")
            assert llm.model_name == "test-model-openai"
