import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from autologic.core.resilience import ResilienceConfig, ResilientCaller
from autologic.core.llm_provider import OpenRouterLLM

@pytest.mark.asyncio
async def test_resilient_caller_override():
    """Verify that ResilientCaller respects the resilience_override parameter."""
    base_config = ResilienceConfig(retry_enabled=False, max_retries=0)
    caller = ResilientCaller(base_config)
    
    # Mock function that fails once then succeeds
    mock_func = AsyncMock()
    mock_func.side_effect = [Exception("rate limit error"), "Success"]
    
    # Without override, it should fail (retry_enabled=False)
    with pytest.raises(Exception, match="rate limit error"):
        await caller.call(mock_func)
    
    assert mock_func.call_count == 1
    
    # With override, it should succeed after retry
    override_config = ResilienceConfig(retry_enabled=True, max_retries=1, retry_base_delay=0.01)
    mock_func.reset_mock()
    mock_func.side_effect = [Exception("rate limit error"), "Success"]
    
    result = await caller.call(mock_func, resilience_override=override_config)
    
    assert result == "Success"
    assert mock_func.call_count == 2

@pytest.mark.asyncio
@patch('autologic.core.llm_provider.ChatOpenAI')
async def test_llm_provider_override_extraction(mock_chat):
    """Verify that OpenRouterLLM correctly extracts resilience overrides from kwargs."""
    # We use OpenRouterLLM as an example
    with patch('autologic.core.llm_provider.get_resilient_caller') as mock_get_caller:
        mock_resilient_caller = AsyncMock()
        mock_get_caller.return_value = mock_resilient_caller
        
        provider = OpenRouterLLM(model_name="test", api_key="sk-test")
        
        # Call with resilience params
        await provider.call("hello", max_retries=5, retry_enabled=True)
        
        # Check if resilient_caller.call was called with a resilience_override
        args, kwargs = mock_resilient_caller.call.call_args
        override = kwargs.get('resilience_override')
        
        assert override is not None
        assert override.max_retries == 5
        assert override.retry_enabled is True
