
import asyncio
import os
import sys
from unittest.mock import MagicMock, patch, AsyncMock

# Ajouter le répertoire courant au path pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock des dépendances externes AVANT d'importer les modules
sys.modules["langchain_openai"] = MagicMock()
sys.modules["httpx"] = MagicMock()

# Mock spécifique pour ChatOpenAI qui est utilisé dans les __init__
mock_chat = MagicMock()
mock_chat.ainvoke = AsyncMock(return_value=MagicMock(content="Mock Response"))
sys.modules["langchain_openai"].ChatOpenAI = MagicMock(return_value=mock_chat)

# Mock des variables d'environnement pour éviter les erreurs de clés manquantes
with patch.dict(os.environ, {
    "OPENAI_API_KEY": "sk-mock",
    "OPENROUTER_API_KEY": "sk-mock",
    "HUGGINGFACE_API_KEY": "hf_mock",
    "VLLM_API_KEY": "mock",
    "OLLAMA_HOST": "http://localhost:11434"
}):
    from autologic.core.llm_provider import OpenAILLM, OllamaLLM, VLlmLLM, HuggingFaceLLM, OpenRouterLLM
    from autologic.core.resilience import ResilientCaller

async def verify_provider(provider_cls, name, **kwargs):
    print(f"Testing {name}...", end=" ", flush=True)
    
    # 1. Instanciation (devrait marcher grâce aux mocks env vars + mocks classes)
    try:
        provider = provider_cls(model_name="test-model", **kwargs)
    except Exception as e:
        print(f"❌ Init failed: {e}")
        return False

    # 2. Mock du ResilientCaller.call pour vérifier qu'il est appelé
    # On patch au niveau de l'instance ou de la classe ResilientCaller utilisée par le module
    with patch("autologic.core.resilience.ResilientCaller.call", new_callable=AsyncMock) as mock_resilient_call:
        mock_resilient_call.return_value = "Resilient Response"
        
        # 3. Appel de la méthode
        try:
            response = await provider.call("Hello")
        except Exception as e:
            print(f"❌ Call failed: {e}")
            return False
            
        # 4. Vérification
        if mock_resilient_call.called:
            print(f"✅ OK (ResilientCaller invoked)")
            return True
        else:
            print(f"❌ FAILED (ResilientCaller NOT invoked)")
            return False

async def main():
    print("=== Verification Universal Rate Limiter ===\n")
    
    results = []
    
    # Test OpenAI
    results.append(await verify_provider(OpenAILLM, "OpenAI"))
    
    # Test Ollama
    results.append(await verify_provider(OllamaLLM, "Ollama"))
    
    # Test vLLM
    results.append(await verify_provider(VLlmLLM, "vLLM"))
    
    # Test HuggingFace
    results.append(await verify_provider(HuggingFaceLLM, "HuggingFace"))
    
    # Test OpenRouter (déjà existant mais bon de vérifier)
    results.append(await verify_provider(OpenRouterLLM, "OpenRouter"))
    
    if all(results):
        print("\n🎉 All providers are using RateLimiter correctly!")
        sys.exit(0)
    else:
        print("\n⚠️ Some providers failed verification.")
        sys.exit(1)


if __name__ == "__main__":
    # Apply environment patch globally for the execution
    with patch.dict(os.environ, {
        "OPENAI_API_KEY": "sk-mock",
        "OPENROUTER_API_KEY": "sk-mock",
        "HUGGINGFACE_API_KEY": "hf_mock",
        "VLLM_API_KEY": "mock",
        "OLLAMA_HOST": "http://localhost:11434"
    }):
        asyncio.run(main())

