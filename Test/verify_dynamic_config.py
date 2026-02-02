
import asyncio
import httpx
import sys

async def test_solve_task():
    url = "http://127.0.0.1:8000/reason/full"
    
    # Payload avec un modèle spécifique (qui devrait être loggué par le backend)
    payload = {
        "task": "Test de configuration dynamique",
        "parameters": {
            "provider": "OpenRouter",
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "temperature": 0.5,
            "max_tokens": 1000
        }
    }
    
    print(f"Envoi de la requête avec modèle: {payload['parameters']['model']}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            
            if response.status_code == 200:
                print("Succès! Le backend a accepté la requête.")
                print("Réponse:", response.json().get("task"))
            else:
                print(f"Erreur {response.status_code}: {response.text}")
                
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_solve_task())
