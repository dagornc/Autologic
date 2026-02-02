
import sys
import os

# Add the project root to sys.path so we can import the module
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'Code/Backend/Phase2-Inference/01_Reasoning')))

try:
    from autologic.core.model_registry import ModelRegistry
    registry = ModelRegistry()
    openrouter_models = registry.get_models_by_provider("OpenRouter")
    if "openrouter/auto" in openrouter_models:
        print("SUCCESS: 'openrouter/auto' found in OpenRouter models.")
    else:
        print("FAILURE: 'openrouter/auto' NOT found in OpenRouter models.")
        print(f"Available models: {openrouter_models}")
except Exception as e:
    print(f"ERROR: Failed to import or verify ModelRegistry: {e}")
    sys.exit(1)
