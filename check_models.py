import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

async def list_models():
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        print("OPENROUTER_API_KEY not found in environment")
        return

    print("Checking OpenRouter models...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "Authorization": f"Bearer {key}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "AutoLogic",
            }
            response = await client.get(
                "https://openrouter.ai/api/v1/models", headers=headers
            )
            if response.status_code == 200:
                data = response.json()
                models = data.get("data", [])
                
                target_model = "z-ai/glm-4.5-air:free"
                found = False
                for m in models:
                    if m["id"] == target_model:
                        found = True
                        print(f"FOUND: {target_model}")
                        break
                
                if not found:
                    print(f"NOT FOUND: {target_model}")
                    
                    print(f"Total models found: {len(models)}")
                    if len(models) > 0:
                        print("First 5 models:", [m['id'] for m in models[:5]])
                    
                    print("All 'gemini' models found:")
                    gemini_found = False
                    for m in models:
                        if "gemini" in m["id"].lower():
                            print(f"- {m['id']} (Pricing: {m.get('pricing')})")
                            gemini_found = True
                    
                    if not gemini_found:
                        print("No 'gemini' models found.")
            else:
                print(f"Error: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
