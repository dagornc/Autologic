import pytest
from unittest.mock import AsyncMock, MagicMock
from autologic.core.engine import AutoLogicEngine, BaseLLM

class MockLLM(BaseLLM):
    def __init__(self, should_fail=False):
        self.should_fail = should_fail
    
    @property
    def model_name(self) -> str:
        return "mock-llm"

    async def call(self, prompt: str, **kwargs) -> str:
        if self.should_fail:
            raise Exception("Connection error")
        return '{"selected_modules": ["decomposer_le_probleme"]}'

@pytest.mark.asyncio
async def test_select_modules_fallback():
    # Setup Engine with failing LLM
    failing_llm = MockLLM(should_fail=True)
    engine = AutoLogicEngine(root_model=failing_llm, worker_model=failing_llm)
    
    # Execute selection
    # Expectation: Should NOT raise exception, but return default modules
    modules = await engine.select_modules("Test task")
    
    # Verification
    assert len(modules) > 0
    assert modules[0].id == "decomposer_le_probleme"
    print(f"Fallback successful. Selected modules: {[m.id for m in modules]}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_select_modules_fallback())
