# test_engine_cli.py
import asyncio
import sys
import os

# Ajout du chemin pour trouver le package autologic
sys.path.append(os.path.join(os.getcwd(), "Code/Backend/Phase2-Inference/01_Reasoning"))

from autologic.core.engine import AutoLogicEngine, BaseLLM
from autologic.main import MockLLM

async def main():
    print("🦖 Testing AutoLogic Engine (CLI)...")
    
    # Setup
    root_llm = MockLLM("root")
    worker_llm = MockLLM("worker")
    engine = AutoLogicEngine(root_llm, worker_llm)
    
    # Test Data Loading
    print(f"📚 Loaded {len(engine.reasoning_modules)} reasoning modules.")
    if len(engine.reasoning_modules) == 0:
        print("❌ Error: No modules loaded!")
        return

    # Test Task
    task = "How can I solve the problem of climate change?"
    print(f"\n🧠 Processing Task: {task}")
    
    result = await engine.run_full_cycle(task)
    
    print("\n✅ Result:")
    import json
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
