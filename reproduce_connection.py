import asyncio
import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.append("/Users/cdagorn/Projets_Python/AutoLogic/Code/Backend/Phase2-Inference/01_Reasoning")

try:
    from autologic.core.llm_provider import OpenRouterLLM
    from autologic.utils.logging_config import get_logger
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

# Load environment variables
load_dotenv("/Users/cdagorn/Projets_Python/AutoLogic/.env")

logger = get_logger(__name__)

async def test_connection():
    print("Testing OpenRouter connection...")
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("ERROR: OPENROUTER_API_KEY not found in .env")
        return

    print(f"API Key present: {api_key[:5]}...")

    try:
        llm = OpenRouterLLM(
            model_name="openrouter/auto", # Using the model from the logs
            api_key=api_key,
            timeout=30
        )
        
        print(f"LLM initialized. Model: {llm.model_name}")
        
        response = await llm.call("Hello, are you working?")
        print(f"Response: {response}")
        
    except Exception as e:
        print(f"Caught exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
