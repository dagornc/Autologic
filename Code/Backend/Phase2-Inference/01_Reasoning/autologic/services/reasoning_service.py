"""
Service layer for reasoning operations.
Encapsulates business logic for configuring and running the AutoLogic engine.
"""

from typing import Dict, Any, Optional, Callable, Awaitable
from ..core.engine import AutoLogicEngine
from ..core.provider_factory import get_provider_factory
from ..utils.logging_config import get_logger

logger = get_logger(__name__)

class ReasoningService:
    """
    Service responsible for executing reasoning tasks.
    It handles LLM instantiation, configuration parsing, and engine orchestration.
    """

    async def execute_task(
        self,
        task: str,
        parameters: Dict[str, Any],
        progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
    ) -> Dict[str, Any]:
        """
        Executes the Self-Discover reasoning cycle for a given task.

        Args:
            task: The problem statement to solve.
            parameters: Configuration parameters (models, timeouts, resilience settings).
            progress_callback: Optional async function to receive progress events.

        Returns:
            The result of the reasoning cycle.
        """
        logger.info(f"ReasoningService executing task: {task[:100]}...")

        try:
            # 1. Parse Parameters
            override_provider = parameters.get("provider")
            override_model = parameters.get("model")

            # 2. Extract Common LLM Configuration
            common_kwargs = self._extract_common_kwargs(parameters)

            # 3. Instantiate LLMs via Factory
            factory = get_provider_factory()

            if override_provider or override_model:
                logger.info(
                    f"Override detected: Root & Worker & Audit using {override_provider}/{override_model}"
                )
                root_llm = factory.create_llm(
                    provider=override_provider, model=override_model, **common_kwargs
                )
                worker_llm = factory.create_llm(
                    provider=override_provider, model=override_model, **common_kwargs
                )
                audit_llm = factory.create_llm(
                    provider=override_provider, model=override_model, **common_kwargs
                )
            else:
                logger.info("Using Multi-Agent Configuration (Root/Worker/Audit)")
                
                root_kwargs = self._merge_resilience_config(common_kwargs, parameters, prefix="")
                worker_kwargs = self._merge_resilience_config(common_kwargs, parameters, prefix="worker")
                audit_kwargs = self._merge_resilience_config(common_kwargs, parameters, prefix="audit")

                root_llm = factory.create_llm(**root_kwargs)
                worker_llm = factory.create_worker_llm(**worker_kwargs)
                audit_llm = factory.create_audit_llm(**audit_kwargs)

            logger.info(
                f"Cycle Configured -> Root: {root_llm.model_name} | Worker: {worker_llm.model_name} | Audit: {audit_llm.model_name}"
            )

            # 4. Initialize Engine
            engine = AutoLogicEngine(
                root_model=root_llm,
                worker_model=worker_llm,
                audit_model=audit_llm,
                progress_callback=progress_callback
            )

            # 5. Determine Execution Parameters
            audit_timeout = (
                parameters.get("audit_timeout") 
                or factory._config.get("audit_timeout") 
                or 30
            )
            audit_max_retries = (
                parameters.get("audit_max_retries") 
                or factory._config.get("audit_max_retries") 
                or 3
            )

            # 6. Run Cycle
            result = await engine.run_full_cycle(
                task,
                root_llm=root_llm,
                worker_llm=worker_llm,
                audit_llm=audit_llm,
                audit_timeout=int(audit_timeout),
                audit_max_retries=int(audit_max_retries),
            )

            return result

        except Exception as e:
            logger.error(f"ReasoningService Execution Failed: {e}")
            raise

    def _extract_common_kwargs(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts standard LLM parameters from the request."""
        return {
            k: v
            for k, v in {
                "api_key": params.get("api_key"),
                "temperature": params.get("temperature"),
                "max_tokens": params.get("max_tokens"),
                "timeout": params.get("timeout"),
                "retry_enabled": params.get("retry_enabled"),
                "max_retries": params.get("max_retries"),
                "fallback_enabled": params.get("fallback_enabled"),
                "retry_base_delay": params.get("retry_base_delay"),
                "rate_limit": params.get("rate_limit"),
            }.items()
            if v is not None
        }

    def _merge_resilience_config(self, base_kwargs: Dict[str, Any], params: Dict[str, Any], prefix: str) -> Dict[str, Any]:
        """Merges specific resilience settings for a role (root, worker, audit)."""
        # Handle prefix mapping (e.g., "worker" -> "workerRateLimit")
        # Note: keys in params are camelCase from frontend usually, need to match what _run_task_logic expected
        
        # Mapping based on previous logic:
        # root -> rateLimit, retryEnabled, fallbackEnabled
        # worker -> workerRateLimit, ...
        
        prefix_str = prefix if prefix else ""
        
        # Helper to get param with fallback casing if needed, though here we stick to what was in the router
        def get_param(key_suffix):
            # specific key construction: e.g. "workerRateLimit" or "rateLimit"
            if prefix_str:
                key = f"{prefix_str}{key_suffix}"
            else:
                # Root uses bare keys like "rateLimit" in the original code? 
                # Checking original: root_resilience = {"rate_limit": params.get("rateLimit")...}
                # Yes, frontend sends "rateLimit", "workerRateLimit".
                # But python internal kwargs expect "rate_limit".
                key = key_suffix # e.g. RateLimit
                # Lowercase first letter if it's the start
                key = key[0].lower() + key[1:]
            return params.get(key)

        resilience = {
            "rate_limit": get_param("RateLimit"),
            "retry_enabled": get_param("RetryEnabled"),
            "fallback_enabled": get_param("FallbackEnabled")
        }
        
        return {**base_kwargs, **{k: v for k, v in resilience.items() if v is not None}}
