import os
import asyncio
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "Code/Backend/Phase2-Inference/01_Reasoning"))

try:
    from autologic.core.provider_factory import get_provider_factory, ProviderFactory
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

load_dotenv()

async def test_factory():
    print("Testing ProviderFactory creation of OpenRouterLLM...")
    
    # Initialize Factory (loads global.yaml automatically)
    factory = get_provider_factory()
    
    # Simulate extraction of params like in reasoning.py
    # But we want to test the specific model that failed
    target_model = "z-ai/glm-4.5-air:free"
    
    print(f"Creating LLM via factory for model: {target_model}")
    
    try:
        # We mimic the call in reasoning.py
        llm = factory.create_llm(
            provider="openrouter", 
            model=target_model,
            retry_enabled=True,
            max_retries=3,
            fallback_enabled=True,
            rate_limit=16.0
        )
        
        print(f"Initialized LLM: {llm.model_name}")
        print(f"Provider: {llm.provider_name}")
        
        print("Calling llm.call()...")
        response = await llm.call("Hello, working?")
        print("Response received!")
        print(response)
        
    except Exception as e:
        print(f"Caught exception in test: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_factory())
