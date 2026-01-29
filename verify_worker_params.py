
import urllib.request
import json
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TestWorkerParams")

URL = "http://127.0.0.1:8000/api/providers/config"

def send_request(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    
    if data:
        jsondata = json.dumps(data).encode('utf-8')
        req.add_header('Content-Length', len(jsondata))
    else:
        jsondata = None
        
    try:
        with urllib.request.urlopen(req, data=jsondata) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        logger.error(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        raise
    except Exception as e:
        logger.error(f"Error: {e}")
        raise

def test():
    # 1. Reset config to default (single LLM)
    logger.info("Step 1: Resetting config to defaults (Root only)...")
    payload_reset = {
        "provider": "OpenRouter",
        "model": "google/gemini-2.0-flash-exp:free",
        "temperature": 0.7,
        "max_tokens": 4096,
        "top_p": 1.0,
        # Worker fields omitted (should be interpreted as None by Pydantic and trigger pop logic)
    }
    send_request('POST', URL, payload_reset)
    
    # Check GET
    data = send_request('GET', URL)
    logger.info(f"Received data (Reset): {json.dumps(data, indent=2)}")
    # Check fallback behavior: worker_provider should match active_provider if not set
    # Note: Backend get_providers_config uses self._config.get("worker_provider") or self._config.get("active_provider")?
    # No, model logic: 
    # worker_provider=config.get("worker_provider", config.get("active_provider")),
    assert data["worker_provider"] == "OpenRouter", f"Expected OpenRouter, got {data.get('worker_provider')}"
    assert data["worker_temperature"] is None, "Expected worker_temperature to be None"
    logger.info("Step 1 OK")

    # 2. Set distinct worker params
    logger.info("Step 2: Setting distinct Worker parameters...")
    payload_worker = {
        "provider": "OpenRouter", # Root
        "model": "google/gemini-2.0-flash-exp:free", # Root
        "temperature": 0.5, # Root
        "max_tokens": 2048, # Root
        "top_p": 1.0,
        
        "worker_provider": "Ollama", # Worker
        "worker_model": "mistral",
        "worker_temperature": 0.2,
        "worker_max_tokens": 1024,
        "worker_top_p": 0.9,
        "worker_timeout": 45
    }
    send_request('POST', URL, payload_worker)
    
    # Check GET
    data = send_request('GET', URL)
    logger.info(f"Received data (Update): {json.dumps(data, indent=2)}")

    assert data["worker_provider"] == "Ollama", f"Expected Ollama, got {data.get('worker_provider')}"
    assert data["worker_temperature"] == 0.2, f"Expected 0.2, got {data.get('worker_temperature')}"
    assert data["worker_max_tokens"] == 1024, f"Expected 1024, got {data.get('worker_max_tokens')}"
    assert data["worker_top_p"] == 0.9, f"Expected 0.9, got {data.get('worker_top_p')}"
    assert data["worker_timeout"] == 45, f"Expected 45, got {data.get('worker_timeout')}"
    # Check Root intact
    assert data["temperature"] == 0.5, f"Expected Root temp 0.5, got {data.get('temperature')}"
    logger.info("Step 2 OK")
    
    # 3. Reset Worker (Fallback)
    logger.info("Step 3: Resetting Worker (Fallback mode)...")
    payload_fallback = {
         "provider": "OpenRouter",
         "model": "google/gemini-2.0-flash-exp:free",
         "temperature": 0.7,
         "max_tokens": 4096,
         "top_p": 1.0
         # Worker fields missing -> should imply None in Pydantic -> trigger pop logic in backend
    }
    
    send_request('POST', URL, payload_fallback)
    
    data = send_request('GET', URL)
    assert data["worker_temperature"] is None, "Expected worker_temperature to be None (cleared)"
    assert data['worker_provider'] == "OpenRouter", "Expected fallback to Root provider"
    logger.info("Step 3 OK")

if __name__ == "__main__":
    try:
        test()
        print("\n✅ ALL TESTS PASSED")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
