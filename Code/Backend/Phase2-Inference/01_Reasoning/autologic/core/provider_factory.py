# autologic/core/provider_factory.py
"""
Factory Pattern pour l'instanciation dynamique des providers LLM.

Ce module fournit une factory centralisée permettant de créer
le bon provider LLM selon la configuration.
"""

from typing import Optional, Dict, Any, Type, TYPE_CHECKING
from enum import Enum
import yaml
from pathlib import Path

from ..utils.logging_config import get_logger

if TYPE_CHECKING:
    from .engine import BaseLLM

logger = get_logger(__name__)


class ProviderType(str, Enum):
    """Enumération des types de providers supportés."""

    OPENROUTER = "openrouter"
    OPENAI = "openai"
    OLLAMA = "ollama"
    VLLM = "vllm"
    HUGGINGFACE = "huggingface"


class ProviderFactory:
    """
    Factory pour créer des instances de providers LLM.

    Utilise le pattern Strategy pour instancier le bon provider
    selon la configuration.
    """

    _config: Dict[str, Any] = {}
    _providers: Dict[ProviderType, Type["BaseLLM"]] = {}

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialise la factory avec la configuration.

        Args:
            config_path: Chemin vers le fichier de configuration YAML.
                        Si None, utilise le chemin par défaut.
        """
        if config_path is None:
            # Chemin par défaut relatif au projet
            project_root = Path(__file__).parents[6]
            config_path = str(project_root / "Config" / "global.yaml")

        self._load_config(config_path)
        self._register_providers()
        self._apply_resilience_config()

    def _load_config(self, config_path: str) -> None:
        """Charge la configuration depuis le fichier YAML."""
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                full_config = yaml.safe_load(f)
                self._config = full_config.get("llm", {})
                logger.info(f"Configuration LLM chargée depuis {config_path}")
        except FileNotFoundError:
            logger.warning(f"Fichier de config non trouvé: {config_path}")
            self._config = {}
        except yaml.YAMLError as e:
            logger.error(f"Erreur parsing YAML: {e}")
            self._config = {}

    def _register_providers(self) -> None:
        """Enregistre les classes de providers disponibles."""
        # Import lazy pour éviter les imports circulaires
        from .llm_provider import OpenRouterLLM, OpenAILLM, OllamaLLM, VLlmLLM, HuggingFaceLLM

        self._providers = {
            ProviderType.OPENROUTER: OpenRouterLLM,
            ProviderType.OPENAI: OpenAILLM,
            ProviderType.OLLAMA: OllamaLLM,
            ProviderType.VLLM: VLlmLLM,
            ProviderType.HUGGINGFACE: HuggingFaceLLM,
        }

    def _apply_resilience_config(self) -> None:
        """Applique la configuration de résilience depuis le YAML."""
        from .resilience import ResilienceConfig, set_resilience_config

        resilience_conf = self._config.get("resilience", {})
        if resilience_conf:
            config = ResilienceConfig(
                rate_limit=resilience_conf.get("rate_limit", 5.0),
                retry_enabled=resilience_conf.get("retry_enabled", False),
                max_retries=resilience_conf.get("max_retries", 3),
                retry_base_delay=resilience_conf.get("retry_base_delay", 1.0),
                fallback_enabled=resilience_conf.get("fallback_enabled", False),
            )
            # Appliquer à tous les providers
            for provider_type in ProviderType:
                set_resilience_config(provider_type.value, config)
            logger.info(f"Configuration de résilience appliquée: {config.to_dict()}")

    def get_active_provider(self) -> str:
        """Retourne le provider actif (Root LLM) selon la configuration."""
        return self._config.get("active_provider", "openrouter")

    def get_active_model(self) -> str:
        """Retourne le modèle actif (Root LLM) selon la configuration."""
        return self._config.get("active_model", "meta-llama/llama-3.3-70b-instruct:free")

    def get_worker_provider(self) -> str:
        """Retourne le provider actif pour le Worker LLM."""
        # Par défaut, fallback sur le provider principal
        return self._config.get("worker_provider", self.get_active_provider())

    def get_worker_model(self) -> str:
        """Retourne le modèle actif pour le Worker LLM."""
        # Par défaut, fallback sur le modèle principal
        return self._config.get("worker_model", self.get_active_model())

    def is_provider_enabled(self, provider: str) -> bool:
        """Vérifie si un provider est activé dans la configuration."""
        providers_config = self._config.get("providers", {})
        provider_config = providers_config.get(provider.lower(), {})
        return provider_config.get("enabled", False)

    def get_provider_config(self, provider: str) -> Dict[str, Any]:
        """Récupère la configuration spécifique d'un provider."""
        providers_config = self._config.get("providers", {})
        return providers_config.get(provider.lower(), {})

    def create_llm(self, provider: Optional[str] = None, model: Optional[str] = None, **kwargs: Any) -> "BaseLLM":
        """
        Crée une instance du provider LLM approprié.

        Args:
            provider: Nom du provider (utilise active_provider si None)
            model: Nom du modèle (utilise le default du provider si None)
            **kwargs: Arguments supplémentaires passés au provider

        Returns:
            Instance de BaseLLM configurée

        Raises:
            ValueError: Si le provider n'est pas supporté ou non activé
        """
        # Utiliser les valeurs par défaut si non spécifiées
        provider_name = provider or self.get_active_provider()

        # Valider le type de provider
        try:
            provider_type = ProviderType(provider_name.lower())
        except ValueError:
            raise ValueError(
                f"Provider '{provider_name}' non supporté. " f"Providers disponibles: {[p.value for p in ProviderType]}"
            )

        # Vérifier si le provider est activé
        if not self.is_provider_enabled(provider_name):
            raise ValueError(f"Provider '{provider_name}' n'est pas activé dans la configuration.")

        # Récupérer la config du provider
        provider_config = self.get_provider_config(provider_name)

        # Déterminer le modèle à utiliser
        # Priorité:
        # 1. Argument explicit 'model'
        # 2. 'active_model' si on utilise le provider actif
        # 3. 'worker_model' si on utilise le worker provider (et pas d'arg model)
        # 4. 'default_model' du provider

        current_active_model = self.get_active_model()
        current_worker_model = self.get_worker_model()
        is_active_provider = provider_name == self.get_active_provider()
        is_worker_provider = provider_name == self.get_worker_provider()

        if model:
            model_name = model
        elif is_active_provider and current_active_model:
            model_name = current_active_model
        elif is_worker_provider and current_worker_model:  # Si on demande explicitement le worker provider sans modèle
            model_name = current_worker_model
        else:
            model_name = provider_config.get("default_model", current_active_model)

        # Récupérer la classe du provider
        provider_class = self._providers.get(provider_type)
        if provider_class is None:
            raise ValueError(f"Classe provider non trouvée pour: {provider_type}")

        # Construire les arguments pour le provider
        llm_kwargs = {"model_name": model_name, **kwargs}

        # Ajouter base_url si configuré
        if "base_url" in provider_config:
            llm_kwargs["base_url"] = provider_config["base_url"]

        # Ajouter les paramètres globaux
        if "temperature" in self._config:
            llm_kwargs.setdefault("temperature", self._config["temperature"])
        if "max_tokens" in self._config:
            llm_kwargs.setdefault("max_tokens", self._config["max_tokens"])
        if "timeout" in provider_config:
            llm_kwargs["timeout"] = provider_config["timeout"]
        elif "timeout" in self._config:
            llm_kwargs.setdefault("timeout", self._config["timeout"])

        logger.info(f"Création LLM: provider={provider_name}, model={model_name}")

        return provider_class(**llm_kwargs)

    def create_worker_llm(self, **kwargs: Any) -> "BaseLLM":
        """
        Crée le Worker LLM (tactique) configuré.

        Args:
            **kwargs: Arguments supplémentaires

        Returns:
            Instance de BaseLLM pour le worker
        """
        provider = self.get_worker_provider()
        model = self.get_worker_model()

        # Injecter les paramètres Worker spécifiques s'ils existent
        # create_llm utilise setdefault pour les params globaux, donc si on les met ici, ils primeront

        if "temperature" not in kwargs and self._config.get("worker_temperature") is not None:
            kwargs["temperature"] = self._config["worker_temperature"]

        if "max_tokens" not in kwargs and self._config.get("worker_max_tokens") is not None:
            kwargs["max_tokens"] = self._config["worker_max_tokens"]

        if "top_p" not in kwargs and self._config.get("worker_top_p") is not None:
            kwargs["top_p"] = self._config["worker_top_p"]

        if "timeout" not in kwargs and self._config.get("worker_timeout") is not None:
            kwargs["timeout"] = self._config["worker_timeout"]

        logger.info(f"Création Worker LLM: {provider}/{model}")
        return self.create_llm(provider=provider, model=model, **kwargs)

    def get_available_providers(self) -> Dict[str, bool]:
        """
        Retourne la liste des providers avec leur état d'activation.

        Returns:
            Dict mapping provider_name -> is_enabled
        """
        result = {}
        for provider_type in ProviderType:
            result[provider_type.value] = self.is_provider_enabled(provider_type.value)
        return result

    def get_models_for_provider(self, provider: str) -> list:
        """
        Retourne la liste des modèles configurés pour un provider.

        Args:
            provider: Nom du provider

        Returns:
            Liste des noms de modèles
        """
        provider_config = self.get_provider_config(provider)
        return provider_config.get("models", [])


# Instance singleton pour usage global
_factory_instance: Optional[ProviderFactory] = None


def get_provider_factory() -> ProviderFactory:
    """
    Retourne l'instance singleton de la factory.

    Returns:
        Instance de ProviderFactory
    """
    global _factory_instance
    if _factory_instance is None:
        _factory_instance = ProviderFactory()
    return _factory_instance


def create_llm(provider: Optional[str] = None, model: Optional[str] = None, **kwargs: Any) -> "BaseLLM":
    """
    Fonction utilitaire pour créer un LLM via la factory.

    Wrapper pratique autour de get_provider_factory().create_llm()

    Args:
        provider: Nom du provider
        model: Nom du modèle
        **kwargs: Arguments supplémentaires

    Returns:
        Instance de BaseLLM
    """
    return get_provider_factory().create_llm(provider, model, **kwargs)
