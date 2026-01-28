
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from autologic.core.provider_factory import get_provider_factory, ProviderType

def verify_ollama_timeout():
    print("Verifying Ollama timeout configuration...")
    
    factory = get_provider_factory()
    # Force reload config to ensure we get the latest changes
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
    config_path = os.path.join(project_root, "Config", "global.yaml")
    factory._load_config(config_path)
    
    try:
        # Create Ollama LLM
        # We don't need a real server running if we just check initialization attributes
        # But create_llm might try to connect or validation?
        # Looking at OllamaLLM.__init__, it just sets up the client.
        
        llm = factory.create_llm(provider="ollama", model="llama3")
        
        # Check timeout in client
        print(f"Inspecting ChatOpenAI instance attributes: {dir(llm.client)}")
        
        # Try different possible attribute names for timeout
        client_timeout = getattr(llm.client, "request_timeout", None) or getattr(llm.client, "timeout", None)
        
        print(f"Ollama LLM Timeout: {client_timeout}")
        
        if client_timeout == 120.0:
            print("SUCCESS: Timeout is correctly set to 120s")
        else:
            print(f"FAILURE: Timeout is {client_timeout}s, expected 120s")
            
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_ollama_timeout()
