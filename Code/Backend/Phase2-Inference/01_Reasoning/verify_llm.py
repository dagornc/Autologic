from dotenv import load_dotenv
import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from autologic.core.llm_provider import OpenRouterLLM

async def main():
    load_dotenv()
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY not found in env.")
        return

    print(f"Testing OpenRouter with key: {api_key[:10]}...")
    
    llm = OpenRouterLLM(model_name="meta-llama/llama-3.3-70b-instruct:free")
    
    try:
        print("Sending request...")
        response = await llm.call("Hello, who are you? Reply in one sentence.")
        print(f"Response: {response}")
        print("Verification SUCCESS")
    except Exception as e:
        print(f"Verification FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
