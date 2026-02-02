
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the current directory (01_Reasoning) to sys.path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

# Also add project root for other potential imports if needed, but autologic is here
PROJECT_ROOT = current_dir.parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
load_dotenv(ENV_FILE, override=True)

from autologic.core.engine import AutoLogicEngine
from autologic.core.provider_factory import get_provider_factory
from autologic.utils.logging_config import setup_logging

async def reproduce():
    setup_logging(log_level="DEBUG")
    
    print("Initializing Factory...")
    try:
        factory = get_provider_factory()
        root_llm = factory.create_llm()
        worker_llm = factory.create_worker_llm()
        
        print(f"Root LLM: {root_llm.model_name}")
        
        engine = AutoLogicEngine(root_model=root_llm, worker_model=worker_llm)
        
        task = "Analyze the provided image and extract reasoning modules."
        
        print(f"Selecting modules for task: {task}")
        modules = await engine.select_modules(task)
        
        print(f"Selected {len(modules)} modules.")
        for m in modules:
            print(f"- {m.name}")
            
    except Exception as e:
        print(f"Reproduction caught error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reproduce())
