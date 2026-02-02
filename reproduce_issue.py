
import asyncio
import os
import json
from pathlib import Path
from dotenv import load_dotenv

import sys

# Add project root to path
sys.path.append(str(Path(__file__).parent / "Code" / "Backend" / "Phase2-Inference" / "01_Reasoning"))

from autologic.core.llm_provider import OpenRouterLLM
from autologic.core.engine import AutoLogicEngine
from autologic.core.models import ReasoningModule

async def main():
    load_dotenv()
    
    model_name = "tngtech/deepseek-r1t2-chimera:free"
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    if not api_key:
        print("Error: OPENROUTER_API_KEY not found in .env")
        return

    print(f"Testing model: {model_name}")
    
    try:
        llm = OpenRouterLLM(model_name=model_name, api_key=api_key)
        engine = AutoLogicEngine(root_model=llm, worker_model=llm)
        
        task = "Explique le fonctionnement technique de l'Easter Egg Google Gravity."
        
        # Test 1: Selection
        print("\n--- Testing Selection ---")
        selected = await engine.select_modules(task)
        print(f"Selected {len(selected)} modules: {[m.id for m in selected]}")
        
        if not selected:
            # Fallback to defaults to test adaptation
            selected = [
                ReasoningModule(id="decomposer_le_probleme", name="Décomposer", description="...", category="..."),
                ReasoningModule(id="analyser_les_contraintes", name="Analyser", description="...", category="...")
            ]
            print("Using fallback selected modules for adaptation test.")

        # Test 2: Adaptation
        print("\n--- Testing Adaptation ---")
        try:
            adapted = await engine.adapt_modules(selected, task)
            print(f"Adapted {len(adapted)} modules.")
            for mod in adapted:
                print(f"ID: {mod.base.id}")
                print(f"Desc: {mod.adapted_description[:100]}...")
                print(f"Actions: {mod.specific_actions}")
        except Exception as e:
            print(f"Adaptation failed with error: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"Initialization failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
