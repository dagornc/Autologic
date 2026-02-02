# autologic/core/llm_provider.py
"""
Implémentations des providers LLM pour AutoLogic.

Ce module contient les classes concrètes pour chaque provider LLM supporté:
- OpenRouterLLM
- OpenAILLM
- OllamaLLM
- VLlmLLM
- HuggingFaceLLM
"""

from typing import Any, List, Optional
import os
import httpx
import random

from pydantic import SecretStr
from langchain_openai import ChatOpenAI
from ..utils.logging_config import get_logger
from .resilience import (
    ResilienceConfig,
    get_resilience_config,
    get_resilient_caller,
)

logger = get_logger(__name__)


# Import de BaseLLM depuis engine.py pour éviter duplication
from .engine import BaseLLM

# Les providers héritent de BaseLLM importé depuis engine.py


class OpenRouterLLM(BaseLLM):
    """
    Implémentation pour OpenRouter via LangChain ChatOpenAI.

    OpenRouter agrège plusieurs providers (OpenAI, Anthropic, Google, etc.)
    sous une API unifiée.
    """

    def __init__(
        self,
        model_name: str,
        api_key: Optional[str] = None,
        base_url: str = "https://openrouter.ai/api/v1",
        timeout: float = 120.0,
        max_retries: int = 2,
        resilience_key: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialise le provider OpenRouter.

        Args:
            model_name: ID du modèle (ex: "google/gemini-2.0-flash-001")
            api_key: Clé API. Si None, lit OPENROUTER_API_KEY.
            base_url: URL de base de l'API
            timeout: Timeout en secondes
            max_retries: Nombre de retries
            resilience_key: Clé spécifique pour la configuration de résilience (ex: "openrouter_worker")
            rate_limit: Limite de requêtes par seconde (optionnel)
            retry_enabled: Activer les retries (optionnel)
            fallback_enabled: Activer le fallback (optionnel)
        """
        self._model_name = model_name
        self._api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self._resilience_key = resilience_key or "openrouter"
        
        # Store resilience override if provided
        self._resilience_override = None
        if any(k in kwargs for k in ["rate_limit", "retry_enabled", "max_retries", "retry_base_delay", "fallback_enabled"]):
            # We need to import ResilienceConfig here or assume it's available
            from .resilience import ResilienceConfig, get_resilience_config
            # Get default config to merge with
            default = get_resilience_config(self._resilience_key)
            
            self._resilience_override = ResilienceConfig(
                rate_limit=kwargs.get("rate_limit", default.rate_limit),
                retry_enabled=kwargs.get("retry_enabled", default.retry_enabled),
                max_retries=kwargs.get("max_retries", default.max_retries),
                retry_base_delay=kwargs.get("retry_base_delay", default.retry_base_delay),
                fallback_enabled=kwargs.get("fallback_enabled", default.fallback_enabled)
            )
            logger.info(f"Resilience Override for {model_name} ({self._resilience_key}): {self._resilience_override.to_dict()}")

        if not self._api_key:
            raise ValueError(
                "Clé API OpenRouter requise. "
                "Définir OPENROUTER_API_KEY ou passer api_key."
            )

        # Configure custom httpx client for better resilience
        self.http_client = httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            transport=httpx.AsyncHTTPTransport(retries=3)
        )
        
        self.client = ChatOpenAI(
            model=self._model_name,
            api_key=SecretStr(self._api_key),
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
            http_async_client=self.http_client
        )
        logger.info(
            f"OpenRouterLLM initialisé: {model_name} (key={self._resilience_key})"
        )

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def provider_name(self) -> str:
        return "openrouter"

    # Cache des modèles gratuits pour le fallback
    _free_models_cache: List[str] = []

    async def call(self, prompt: str, **kwargs: Any) -> str:
        """
        Exécute un appel à OpenRouter avec résilience.

        Applique:
        - Rate limiting (configurable, 5 req/s par défaut)
        - Retry automatique sur 429/5xx si activé
        - Fallback vers un autre modèle gratuit si activé
        """
        resilient_caller = get_resilient_caller(self._resilience_key)

        async def _make_call() -> str:
            """Appel interne."""
            model_kwargs = {}
            if kwargs.get("response_format", {}).get("type") == "json_object":
                model_kwargs["response_format"] = {"type": "json_object"}

            base_url = getattr(self.client, "base_url", "unknown")
            logger.info(
                f"OpenRouter Call - Model: {self._model_name}, BaseURL: {base_url}"
            )

            try:
                response = await self.client.ainvoke(prompt, **model_kwargs)  # type: ignore
            except Exception as e:
                # Retry on 400 with response_format issue is a provider quirk, kept here
                if "400" in str(e) and "response_format" in model_kwargs:
                    logger.warning(
                        f"Retrying without response_format due to error: {e}"
                    )
                    del model_kwargs["response_format"]
                    response = await self.client.ainvoke(prompt, **model_kwargs)  # type: ignore
                else:
                    raise e

            return str(response.content)

        async def _fallback_call() -> str:
            """Appel de fallback avec un autre modèle gratuit."""
            fallback_model = await self._get_fallback_model()
            if not fallback_model:
                raise RuntimeError("Aucun modèle de fallback disponible")

            logger.info(f"OpenRouter Fallback: {self._model_name} -> {fallback_model}")

            # Créer un nouveau client avec le modèle de fallback
            fallback_client = ChatOpenAI(
                model=fallback_model,
                api_key=SecretStr(self._api_key) if self._api_key else None,
                base_url="https://openrouter.ai/api/v1",
                timeout=60.0,
                max_retries=1,
            )

            model_kwargs = {}
            if kwargs.get("response_format", {}).get("type") == "json_object":
                model_kwargs["response_format"] = {"type": "json_object"}

            try:
                response = await fallback_client.ainvoke(prompt, **model_kwargs)  # type: ignore
            except Exception as e:
                if "400" in str(e) and "response_format" in model_kwargs:
                    del model_kwargs["response_format"]
                    response = await fallback_client.ainvoke(prompt, **model_kwargs)  # type: ignore
                else:
                    raise e

            return str(response.content)

        try:
            config = get_resilience_config(self._resilience_key)
            fallback_func = _fallback_call if config.fallback_enabled else None
            
            # Use instance override if available, or compute from kwargs call-time
            resilience_override = getattr(self, "_resilience_override", None)
            
            if not resilience_override and any(k in kwargs for k in ["retry_enabled", "max_retries", "fallback_enabled", "retry_base_delay", "rate_limit"]):
                resilience_override = ResilienceConfig(
                    rate_limit=kwargs.get("rate_limit", config.rate_limit),
                    retry_enabled=kwargs.get("retry_enabled", config.retry_enabled),
                    max_retries=kwargs.get("max_retries", config.max_retries),
                    retry_base_delay=kwargs.get("retry_base_delay", config.retry_base_delay),
                    fallback_enabled=kwargs.get("fallback_enabled", config.fallback_enabled)
                )

            # If override exists, update fallback behavior based on it
            if resilience_override:
                fallback_func = _fallback_call if resilience_override.fallback_enabled else None

            return await resilient_caller.call(
                _make_call,
                fallback_func=fallback_func,
                resilience_override=resilience_override
            )
        except Exception as e:
            logger.error(f"Erreur OpenRouter ({self._model_name}): {e}")
            raise

    async def _get_fallback_model(self) -> Optional[str]:
        """Récupère un modèle gratuit alternatif pour le fallback."""
        # Rafraîchir le cache si vide
        if not OpenRouterLLM._free_models_cache:
            try:
                detailed = await self.list_models_detailed(
                    api_key=self._api_key, free_only=True
                )
                OpenRouterLLM._free_models_cache = [
                    m["id"] for m in detailed if m["id"] != self._model_name
                ]
            except Exception as e:
                logger.warning(f"Impossible de récupérer les modèles de fallback: {e}")
                return None

        # Filtrer le modèle actuel et en choisir un au hasard
        available = [
            m for m in OpenRouterLLM._free_models_cache if m != self._model_name
        ]

        if not available:
            return None

        return random.choice(available)

    @classmethod
    async def list_models(
        cls, api_key: Optional[str] = None, raise_error: bool = False
    ) -> List[str]:
        """
        Récupère la liste des modèles disponibles sur OpenRouter.
        """
        detailed = await cls.list_models_detailed(
            api_key=api_key, raise_error=raise_error
        )
        return [m["id"] for m in detailed]

    @classmethod
    async def list_models_detailed(
        cls,
        api_key: Optional[str] = None,
        raise_error: bool = False,
        free_only: bool = False,
    ) -> List[dict]:
        """
        Récupère la liste des modèles disponibles sur OpenRouter avec détails.

        Args:
            api_key: Clé API optionnelle
            raise_error: Si True, lève une exception en cas d'erreur
            free_only: Si True, retourne uniquement les modèles gratuits

        Returns:
            Liste de dicts avec id et is_free
        """
        key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not key:
            if raise_error:
                raise ValueError("Clé API OpenRouter manquante")
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    "Authorization": f"Bearer {key}",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "AutoLogic",
                }
                response = await client.get(
                    "https://openrouter.ai/api/v1/models", headers=headers
                )
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for m in data.get("data", []):
                        # Un modèle est gratuit si prompt et completion sont à 0
                        pricing = m.get("pricing", {})
                        prompt_price = float(pricing.get("prompt", "1") or "1")
                        completion_price = float(pricing.get("completion", "1") or "1")
                        is_free = prompt_price == 0 and completion_price == 0

                        if free_only and not is_free:
                            continue

                        models.append({"id": m["id"], "is_free": is_free})

                    # Trier par id
                    models.sort(key=lambda x: x["id"])
                    logger.info(f"OpenRouter models fetched: {len(models)} models")
                    return models
                elif raise_error:
                    response.raise_for_status()

        except Exception as e:
            if raise_error:
                raise e
            logger.warning(f"Failed to fetch OpenRouter models: {e}")
        return []


class OpenAILLM(BaseLLM):
    """
    Implémentation pour OpenAI directement via LangChain.
    """

    def __init__(
        self,
        model_name: str,
        api_key: Optional[str] = None,
        base_url: str = "https://api.openai.com/v1",
        timeout: float = 60.0,
        max_retries: int = 2,
        resilience_key: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialise le provider OpenAI.

        Args:
            model_name: Nom du modèle (ex: "gpt-4-turbo")
            api_key: Clé API. Si None, lit OPENAI_API_KEY.
            base_url: URL de base de l'API
            timeout: Timeout en secondes
            max_retries: Nombre de retries
            resilience_key: Clé spécifique pour la configuration de résilience (ex: "openai_worker")
        """
        self._model_name = model_name
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._resilience_key = resilience_key or "openai"

        if not self._api_key:
            raise ValueError(
                "Clé API OpenAI requise. " "Définir OPENAI_API_KEY ou passer api_key."
            )

        self.client = ChatOpenAI(
            model=self._model_name,
            api_key=SecretStr(self._api_key),
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
        )
        logger.info(f"OpenAILLM initialisé: {model_name}")

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def provider_name(self) -> str:
        return "openai"

    async def call(self, prompt: str, **kwargs: Any) -> str:
        """Exécute un appel à OpenAI avec rate limiting."""
        resilient_caller = get_resilient_caller(self._resilience_key)

        async def _make_call() -> str:
            model_kwargs = {}
            if kwargs.get("response_format", {}).get("type") == "json_object":
                model_kwargs["response_format"] = {"type": "json_object"}

            response = await self.client.ainvoke(prompt, **model_kwargs)  # type: ignore
            return str(response.content)

        try:
            # Extract resilience overrides from kwargs
            config = get_resilience_config(self._resilience_key)
            resilience_override = None
            if any(k in kwargs for k in ["retry_enabled", "max_retries", "fallback_enabled", "retry_base_delay", "rate_limit"]):
                resilience_override = ResilienceConfig(
                    rate_limit=kwargs.get("rate_limit", config.rate_limit),
                    retry_enabled=kwargs.get("retry_enabled", config.retry_enabled),
                    max_retries=kwargs.get("max_retries", config.max_retries),
                    retry_base_delay=kwargs.get("retry_base_delay", config.retry_base_delay),
                    fallback_enabled=kwargs.get("fallback_enabled", config.fallback_enabled)
                )

            # Pas de fallback spécifique pour OpenAI pour l'instant
            return await resilient_caller.call(
                _make_call,
                resilience_override=resilience_override
            )
        except Exception as e:
            logger.error(f"Erreur OpenAI ({self._model_name}): {e}")
            raise

    @classmethod
    async def list_models(
        cls, api_key: Optional[str] = None, raise_error: bool = False
    ) -> List[str]:
        """
        Récupère la liste des modèles disponibles sur OpenAI.
        """
        key = api_key or os.getenv("OPENAI_API_KEY")
        if not key:
            if raise_error:
                raise ValueError("Clé API OpenAI manquante")
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {"Authorization": f"Bearer {key}"}
                response = await client.get(
                    "https://api.openai.com/v1/models", headers=headers
                )
                if response.status_code == 200:
                    data = response.json()
                    # OpenAI returns { data: [ { id: "..." }, ... ] }
                    models = [
                        m["id"]
                        for m in data.get("data", [])
                        if "gpt" in m["id"] or "o1" in m["id"] or "o3" in m["id"]
                    ]
                    logger.info(f"OpenAI models fetched: {len(models)} models")
                    return sorted(models)
                elif raise_error:
                    response.raise_for_status()

        except Exception as e:
            if raise_error:
                raise e
            logger.warning(f"Failed to fetch OpenAI models: {e}")
        return []


class OllamaLLM(BaseLLM):
    """
    Implémentation pour Ollama (serveur LLM local).

    Ollama expose une API compatible OpenAI sur le port 11434 par défaut.
    """

    def __init__(
        self,
        model_name: str,
        host: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 120.0,
        resilience_key: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialise le provider Ollama.

        Args:
            model_name: Nom du modèle local (ex: "llama3")
            host: URL du serveur Ollama. Si None, lit OLLAMA_HOST.
            api_key: Clé API optionnelle (pour services compatibles type Venice)
            timeout: Timeout en secondes (plus long pour modèles locaux)
            resilience_key: Clé spécifique pour la configuration de résilience
        """
        self._model_name = model_name
        self._host = host or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self._api_key = api_key or "ollama"
        self._resilience_key = resilience_key or "ollama"
        self._timeout = timeout

        # Ollama expose une API compatible OpenAI
        self.client = ChatOpenAI(
            model=self._model_name,
            api_key=SecretStr(self._api_key),
            base_url=f"{self._host}/v1",
            timeout=timeout,
            max_retries=1,
        )
        logger.info(f"OllamaLLM initialisé: {model_name} @ {self._host}")

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def call(self, prompt: str, **kwargs: Any) -> str:
        """Exécute un appel à Ollama avec rate limiting."""
        resilient_caller = get_resilient_caller(self._resilience_key)

        async def _make_call() -> str:
            response = await self.client.ainvoke(prompt)
            return str(response.content)

        try:
            # Extract resilience overrides from kwargs
            config = get_resilience_config(self._resilience_key)
            resilience_override = None
            if any(k in kwargs for k in ["retry_enabled", "max_retries", "fallback_enabled", "retry_base_delay", "rate_limit"]):
                resilience_override = ResilienceConfig(
                    rate_limit=kwargs.get("rate_limit", config.rate_limit),
                    retry_enabled=kwargs.get("retry_enabled", config.retry_enabled),
                    max_retries=kwargs.get("max_retries", config.max_retries),
                    retry_base_delay=kwargs.get("retry_base_delay", config.retry_base_delay),
                    fallback_enabled=kwargs.get("fallback_enabled", config.fallback_enabled)
                )

            return await resilient_caller.call(
                _make_call,
                resilience_override=resilience_override
            )
        except Exception as e:
            logger.error(f"Erreur Ollama ({self._model_name}): {e}")
            raise

    @classmethod
    async def list_models(
        cls,
        host: Optional[str] = None,
        api_key: Optional[str] = None,
        raise_error: bool = False,
        **kwargs: Any,
    ) -> List[str]:
        """
        Récupère la liste des modèles disponibles sur le serveur Ollama.

        Args:
            host: URL du serveur Ollama

        Returns:
            Liste des noms de modèles
        """
        ollama_host = host or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{ollama_host}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    models = [m["name"] for m in data.get("models", [])]
                    logger.info(f"Ollama models détectés: {models}")
                    return models
                elif raise_error:
                    response.raise_for_status()

        except Exception as e:
            if raise_error:
                raise e
            logger.warning(f"Impossible de lister les modèles Ollama: {e}")
        return []


class VLlmLLM(BaseLLM):
    """
    Implémentation pour vLLM (serveur LLM haute performance).

    vLLM expose une API compatible OpenAI.
    """

    def __init__(
        self,
        model_name: str,
        host: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 120.0,
        resilience_key: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialise le provider vLLM.

        Args:
            model_name: Nom du modèle servi par vLLM
            host: URL du serveur vLLM. Si None, lit VLLM_HOST.
            api_key: Clé API si configurée. Si None, lit VLLM_API_KEY.
            timeout: Timeout en secondes
            resilience_key: Clé spécifique pour la configuration de résilience
        """
        self._model_name = model_name
        self._host = host or os.getenv("VLLM_HOST", "http://localhost:8000")
        self._api_key = api_key or os.getenv("VLLM_API_KEY", "token-vllm")
        self._resilience_key = resilience_key or "vllm"

        self.client = ChatOpenAI(
            model=self._model_name,
            api_key=SecretStr(self._api_key) if self._api_key else None,
            base_url=f"{self._host}/v1",
            timeout=timeout,
            max_retries=1,
        )
        logger.info(f"VLlmLLM initialisé: {model_name} @ {self._host}")

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def provider_name(self) -> str:
        return "vllm"

    async def call(self, prompt: str, **kwargs: Any) -> str:
        """Exécute un appel à vLLM avec rate limiting."""
        resilient_caller = get_resilient_caller(self._resilience_key)

        async def _make_call() -> str:
            response = await self.client.ainvoke(prompt)
            return str(response.content)

        try:
            # Extract resilience overrides from kwargs
            config = get_resilience_config(self._resilience_key)
            resilience_override = None
            if any(k in kwargs for k in ["retry_enabled", "max_retries", "fallback_enabled", "retry_base_delay", "rate_limit"]):
                resilience_override = ResilienceConfig(
                    rate_limit=kwargs.get("rate_limit", config.rate_limit),
                    retry_enabled=kwargs.get("retry_enabled", config.retry_enabled),
                    max_retries=kwargs.get("max_retries", config.max_retries),
                    retry_base_delay=kwargs.get("retry_base_delay", config.retry_base_delay),
                    fallback_enabled=kwargs.get("fallback_enabled", config.fallback_enabled)
                )

            return await resilient_caller.call(
                _make_call,
                resilience_override=resilience_override
            )
        except Exception as e:
            logger.error(f"Erreur vLLM ({self._model_name}): {e}")
            raise

    @classmethod
    async def list_models(
        cls,
        host: Optional[str] = None,
        api_key: Optional[str] = None,
        raise_error: bool = False,
        **kwargs: Any,
    ) -> List[str]:
        """
        Récupère la liste des modèles servis par vLLM.

        Args:
            host: URL du serveur vLLM

        Returns:
            Liste des noms de modèles
        """
        vllm_host = host or os.getenv("VLLM_HOST", "http://localhost:8000")
        key = api_key or os.getenv("VLLM_API_KEY", "token-vllm")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {"Authorization": f"Bearer {key}"}
                response = await client.get(f"{vllm_host}/v1/models", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    models = [m["id"] for m in data.get("data", [])]
                    logger.info(f"vLLM models détectés: {models}")
                    return models
                elif raise_error:
                    response.raise_for_status()

        except Exception as e:
            if raise_error:
                raise e
            logger.warning(f"Impossible de lister les modèles vLLM: {e}")
        return []


class HuggingFaceLLM(BaseLLM):
    """
    Implémentation pour HuggingFace Inference API.

    Utilise l'API d'inférence serverless de HuggingFace.
    """

    def __init__(
        self,
        model_name: str,
        api_key: Optional[str] = None,
        base_url: str = "https://api-inference.huggingface.co/models",
        timeout: float = 60.0,
        resilience_key: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialise le provider HuggingFace.

        Args:
            model_name: ID du modèle HF (ex: "meta-llama/Meta-Llama-3-70B-Instruct")
            api_key: Clé API. Si None, lit HUGGINGFACE_API_KEY.
            base_url: URL de base de l'API
            timeout: Timeout en secondes
            resilience_key: Clé spécifique pour la configuration de résilience
        """
        self._model_name = model_name
        self._api_key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        self._base_url = base_url
        self._timeout = timeout
        self._resilience_key = resilience_key or "huggingface"

        if not self._api_key:
            raise ValueError(
                "Clé API HuggingFace requise. "
                "Définir HUGGINGFACE_API_KEY ou passer api_key."
            )

        logger.info(f"HuggingFaceLLM initialisé: {model_name}")

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def provider_name(self) -> str:
        return "huggingface"

    async def call(self, prompt: str, **kwargs: Any) -> str:
        """Exécute un appel à l'API HuggingFace Inference avec rate limiting."""
        resilient_caller = get_resilient_caller(self._resilience_key)

        async def _make_call() -> str:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                headers = {
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                }

                # Format pour les modèles de chat
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": kwargs.get("max_tokens", 4096),
                        "temperature": kwargs.get("temperature", 0.7),
                        "return_full_text": False,
                    },
                }

                url = f"{self._base_url}/{self._model_name}"
                response = await client.post(url, json=payload, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data[0].get("generated_text", "")
                    return str(data)
                else:
                    error_msg = f"HuggingFace API error: {response.status_code}"
                    logger.error(error_msg)
                    raise RuntimeError(error_msg)

        try:
            # Extract resilience overrides from kwargs
            config = get_resilience_config(self._resilience_key)
            resilience_override = None
            if any(k in kwargs for k in ["retry_enabled", "max_retries", "fallback_enabled", "retry_base_delay", "rate_limit"]):
                resilience_override = ResilienceConfig(
                    rate_limit=kwargs.get("rate_limit", config.rate_limit),
                    retry_enabled=kwargs.get("retry_enabled", config.retry_enabled),
                    max_retries=kwargs.get("max_retries", config.max_retries),
                    retry_base_delay=kwargs.get("retry_base_delay", config.retry_base_delay),
                    fallback_enabled=kwargs.get("fallback_enabled", config.fallback_enabled)
                )

            return await resilient_caller.call(
                _make_call,
                resilience_override=resilience_override
            )
        except Exception as e:
            logger.error(f"Erreur HuggingFace ({self._model_name}): {e}")
            raise

    @classmethod
    async def list_models(
        cls, api_key: Optional[str] = None, raise_error: bool = False
    ) -> List[str]:
        """
        Récupère les modèles populaires sur HuggingFace.

        Note: Liste les modèles 'text-generation' les plus téléchargés.
        """
        key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        # Note: HF API allows public access without key for listing, but higher rate limits with key.

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {}
                if key:
                    headers["Authorization"] = f"Bearer {key}"

                # Fetch top 50 text-generation models sorted by downloads
                url = "https://huggingface.co/api/models"
                params = {
                    "filter": "text-generation",
                    "sort": "downloads",
                    "direction": "-1",
                    "limit": "100",
                }

                response = await client.get(url, headers=headers, params=params)

                if response.status_code == 200:
                    data = response.json()
                    # Filter for models that are likely to be interesting (e.g., skip some weird ones)
                    # We accept all text-generation models here.
                    models = [m["id"] for m in data]
                    logger.info(f"HuggingFace models fetched: {len(models)} models")
                    return sorted(models)
                elif raise_error:
                    response.raise_for_status()

        except Exception as e:
            if raise_error:
                raise e
            logger.warning(f"Failed to fetch HuggingFace models: {e}")
        return []
