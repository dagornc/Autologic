
import asyncio
import pytest
from typing import Any
from autologic.core.engine import AutoLogicEngine, BaseLLM
from autologic.core.models import ReasoningModule

class FailingLLM(BaseLLM):
    @property
    def model_name(self) -> str:
        return "failing-llm"

    async def call(self, prompt: str, **kwargs: Any) -> str:
        # Simulate an error (e.g., malformed JSON that fails parsing even after retries)
        return "This is not JSON at all."

@pytest.mark.asyncio
async def test_adaptation_fallback():
    # Setup
    llm = FailingLLM()
    engine = AutoLogicEngine(root_model=llm, worker_model=llm)
    
    selected = [
        ReasoningModule(id="mod1", name="Module 1", description="Description 1", category="Cat 1"),
        ReasoningModule(id="mod2", name="Module 2", description="Description 2", category="Cat 2")
    ]
    task = "Test Task"
    
    # Execute
    print("Executing adaptation with failing LLM...")
    adapted = await engine.adapt_modules(selected, task)
    
    # Verify
    assert len(adapted) == 2
    assert adapted[0].base.id == "mod1"
    assert adapted[0].adapted_description == "Description 1"
    assert adapted[1].base.id == "mod2"
    assert adapted[1].adapted_description == "Description 2"
    assert adapted[0].specific_actions == []
    
    print("Adaptation fallback test passed!")

if __name__ == "__main__":
    asyncio.run(test_adaptation_fallback())
