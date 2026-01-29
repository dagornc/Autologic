import asyncio
import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api"

async def verify_full_config():
    print("=== Starting Full Config Verification ===")
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("1. Checking Connectivity...")
        try:
            resp = await client.get(f"{BASE_URL}/providers/config")
            resp.raise_for_status()
            print("   Backend is UP.")
        except Exception as e:
            print(f"   ERROR: Backend not reachable. {e}")
            return

        print("\n2. Setting Comprehensive Config (Root & Worker)...")
        payload = {
            "provider": "openai",
            "model": "gpt-4-turbo",
            "temperature": 0.8,
            "max_tokens": 2048,
            "top_p": 0.95,
            "timeout": 120,

            "worker_provider": "openrouter",
            "worker_model": "google/gemini-2.0-flash-exp:free",
            "worker_temperature": 0.3,
            "worker_max_tokens": 1024,
            "worker_top_p": 0.85,
            "worker_timeout": 45
        }
        
        try:
            resp = await client.post(f"{BASE_URL}/providers/config", json=payload)
            resp.raise_for_status()
            print("   Config Set.")
        except Exception as e:
             print(f"   ERROR Setting Config: {e}")
             if hasattr(e, 'response'):
                 print(f"   Response: {e.response.text}")
             return

        print("\n3. Verifying Config Persistence...")
        resp = await client.get(f"{BASE_URL}/providers/config")
        data = resp.json()
        print(f"   DEBUG: Received Data Keys: {list(data.keys())}")
        
        errors = []
        FIELD_MAP = {
            "provider": "active_provider",
            "model": "active_model"
        }

        for key, val in payload.items():
            check_key = FIELD_MAP.get(key, key)
            
            if "provider" in key:
                 # Backend stores lowercase usually
                 expected = val.lower()
                 actual = data.get(check_key)
                 if actual: actual = actual.lower()
                 
                 if actual != expected:
                     errors.append(f"{key} (mapped to {check_key}): expected {expected}, got {actual}")
            else:
                 # Numbers/Bools
                 actual = data.get(check_key)
                 if actual != val:
                     errors.append(f"{key}: expected {val}, got {actual}")
        
        if errors:
            print("   FAILURES:")
            for e in errors:
                print(f"   - {e}")
        else:
            print("   SUCCESS: All config parameters match.")

        print("\n4. Setting Resilience (OpenRouter)...")
        res_payload = {
            "provider": "openrouter",
            "rate_limit": 10.0,
            "retry_enabled": True,
            "fallback_enabled": True,
            "max_retries": 5
        }
        try:
            resp = await client.post(f"{BASE_URL}/providers/resilience", json=res_payload)
            if resp.status_code == 404:
                print("   WARNING: Resilience Endpoint NOT FOUND (Did you restart backend?)")
            else:
                resp.raise_for_status()
                print("   Resilience Set.")
                
                print("\n5. Verifying Resilience Persistence...")
                resp = await client.get(f"{BASE_URL}/providers/openrouter/resilience")
                resp.raise_for_status()
                res_data = resp.json()
                
                res_errors = []
                if res_data["rate_limit"] != 10.0: res_errors.append(f"rate_limit: {res_data['rate_limit']} != 10.0")
                if res_data["retry_enabled"] is not True: res_errors.append(f"retry_enabled: {res_data['retry_enabled']} != True")
                
                if res_errors:
                     print("   FAILURE: Resilience mismatch.")
                     for e in res_errors: print(f"   - {e}")
                else:
                     print("   SUCCESS: Resilience parameters match.")

        except httpx.HTTPStatusError as e:
            print(f"   ERROR: {e}")
            if e.response.status_code == 404:
                print("   (Endpoint likely missing)")

if __name__ == "__main__":
    asyncio.run(verify_full_config())
