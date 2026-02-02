import pytest
import httpx
from unittest.mock import MagicMock, AsyncMock, patch
from autologic.core.llm_provider import OpenRouterLLM
from autologic.core.resilience import ResilientCaller, ResilienceConfig

class TestConnectionRobustness:
    """
    Tests focused on connection robustness and error handling.
    """

    @pytest.mark.asyncio
    async def test_openrouter_custom_client_configuration(self):
        """
        Verify that OpenRouterLLM initializes ChatOpenAI with the custom http_client.
        """
        api_key = "sk-test-key"
        
        # Mock ChatOpenAI to inspect arguments
        with patch("autologic.core.llm_provider.ChatOpenAI") as MockChatOpenAI:
            llm = OpenRouterLLM(
                model_name="openrouter/test",
                api_key=api_key,
                timeout=45.0
            )
            
            # Check if ChatOpenAI was called with http_async_client
            _, kwargs = MockChatOpenAI.call_args
            assert "http_async_client" in kwargs
            client = kwargs["http_async_client"]
            
            # Verify client configuration
            assert isinstance(client, httpx.AsyncClient)
            assert client.timeout.read == 45.0
            # Note: limits and transport are internal to httpx client, harder to inspect directly without private access
            # but we can check if they are set
            assert client._transport is not None

    @pytest.mark.asyncio
    async def test_resilient_caller_logs_exception_type(self):
        """
        Verify that ResilientCaller logs the specific exception type name.
        """
        config = ResilienceConfig(max_retries=1, retry_enabled=True, retry_base_delay=0.1)
        caller = ResilientCaller(config)
        
        # Mock logger
        with patch("autologic.core.resilience.logger") as mock_logger:
            # Create a function that raises a specific connection error
            mock_func = AsyncMock(side_effect=httpx.ConnectError("Connection failed"))
            
            try:
                await caller.call(mock_func)
            except httpx.ConnectError:
                pass
            
            # Verify debug logs contain the exception type name
            # We look for "ConnectError" in the call args of logger.debug
            found_type_log = False
            for call in mock_logger.debug.call_args_list:
                args, _ = call
                if "ConnectError" in args[0] and "Detailed Error" in args[0]:
                    found_type_log = True
                    break
            
            assert found_type_log, "Logger should have logged the exception type name 'ConnectError'"

    @pytest.mark.asyncio
    async def test_openrouter_connect_error_retry(self):
        """
        Simulate a connection error and ensure retry logic is triggered.
        """
        # This tests the integration of ResilientCaller when an error occurs
        # We need to mock ChatOpenAI so we can control ainvoke
        with patch("autologic.core.llm_provider.ChatOpenAI") as MockChatOpenAI, \
             patch.dict("os.environ", {"OPENROUTER_API_KEY": "sk-test"}):
            
            # Setup the mock instance
            mock_instance = MockChatOpenAI.return_value
            mock_instance.ainvoke = AsyncMock(side_effect=[
                httpx.ConnectError("Simulated connection failure"),
                MagicMock(content="Success after retry")
            ])
            
            llm = OpenRouterLLM(model_name="test/model")
            
            # calling llm.call should trigger the retry loop in ResilientCaller
            response = await llm.call("Hello")
            
            assert response == "Success after retry"
            assert mock_instance.ainvoke.call_count == 2
