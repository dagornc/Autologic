# autologic/routers/models.py
"""
Routes FastAPI pour les endpoints de gestion des modèles et providers.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import httpx
import os

from ..core.model_registry import ModelRegistry
from ..core.provider_factory import get_provider_factory, ProviderType
from ..core.resilience import (
    get_resilience_config,
    set_resilience_config,
    ResilienceConfig
)
from ..utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["models"])

# Instance partagée du registre
_registry_instance: ModelRegistry | None = None


def get_registry() -> ModelRegistry:
    """Récupère l'instance du registre de modèles."""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = ModelRegistry()
    return _registry_instance


# ============================================
# Pydantic Models
# ============================================

class ProviderConfig(BaseModel):
    """Configuration d'un provider."""
    provider: str
    model: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096
    top_p: Optional[float] = 1.0


class ProviderVerificationRequest(BaseModel):
    """Requête de vérification de connexion."""
    provider: str
    api_key: Optional[str] = None


class ProviderStatus(BaseModel):
    """Status d'un provider."""
    name: str
    enabled: bool
    available: bool
    models: List[str]
    error: Optional[str] = None


class ProvidersConfigResponse(BaseModel):
    """Réponse de configuration des providers."""
    active_provider: str
    active_model: str
    temperature: float
    max_tokens: int
    top_p: float


class ResilienceConfigRequest(BaseModel):
    """Requête de configuration de résilience."""
    provider: str
    rate_limit: Optional[float] = 5.0
    retry_enabled: Optional[bool] = False
    max_retries: Optional[int] = 3
    fallback_enabled: Optional[bool] = False


class ResilienceConfigResponse(BaseModel):
    """Réponse de configuration de résilience."""
    provider: str
    rate_limit: float
    retry_enabled: bool
    max_retries: int
    retry_base_delay: float
    fallback_enabled: bool


# ============================================
# Endpoints existants
# ============================================

@router.get("/models")
async def list_models(
    registry: ModelRegistry = Depends(get_registry)
) -> Dict[str, Any]:
    """
    Retourne la liste des providers et modèles disponibles.
    
    Returns:
        Liste des providers avec leurs modèles respectifs
    """
    logger.debug("Récupération de la liste des modèles")
    return {
        "providers": registry.get_providers(),
        "models": registry.get_all_models()
    }


# ============================================
# Nouveaux endpoints - Configuration Providers
# ============================================

@router.get("/providers/config", response_model=ProvidersConfigResponse)
async def get_providers_config() -> ProvidersConfigResponse:
    """
    Récupère la configuration active des providers.
    
    Returns:
        Configuration active (provider, model, paramètres)
    """
    factory = get_provider_factory()
    config = factory._config
    
    return ProvidersConfigResponse(
        active_provider=factory.get_active_provider(),
        active_model=factory.get_active_model(),
        temperature=config.get("temperature", 0.7),
        max_tokens=config.get("max_tokens", 4096),
        top_p=config.get("top_p", 1.0)
    )


@router.post("/providers/config")
async def update_providers_config(config: ProviderConfig) -> Dict[str, str]:
    """
    Met à jour la configuration active (en mémoire).
    
    Note: Pour persister, modifier Config/global.yaml
    
    Args:
        config: Nouvelle configuration
        
    Returns:
        Message de confirmation
    """
    factory = get_provider_factory()
    
    # Valider le provider
    try:
        ProviderType(config.provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{config.provider}' non supporté"
        )
    
    # Mettre à jour en mémoire
    factory._config["active_provider"] = config.provider.lower()
    factory._config["active_model"] = config.model
    if config.temperature is not None:
        factory._config["temperature"] = config.temperature
    if config.max_tokens is not None:
        factory._config["max_tokens"] = config.max_tokens
    if config.top_p is not None:
        factory._config["top_p"] = config.top_p
    
    logger.info(f"Config mise à jour: {config.provider}/{config.model}")
    
    return {
        "status": "success",
        "message": f"Configuration mise à jour: {config.provider}/{config.model}"
    }


@router.get("/providers/status")
async def get_providers_status() -> Dict[str, List[ProviderStatus]]:
    """
    Vérifie le status de disponibilité de chaque provider.
    
    Returns:
        Liste des providers avec leur status
    """
    factory = get_provider_factory()
    statuses: List[ProviderStatus] = []
    
    for provider_type in ProviderType:
        provider_name = provider_type.value
        provider_config = factory.get_provider_config(provider_name)
        enabled = factory.is_provider_enabled(provider_name)
        models = factory.get_models_for_provider(provider_name)
        
        # Vérifier la disponibilité réelle
        available = False
        error = None
        
        if enabled:
            try:
                available = await _check_provider_availability(
                    provider_name,
                    provider_config
                )
            except Exception as e:
                error = str(e)
        
        statuses.append(ProviderStatus(
            name=provider_name,
            enabled=enabled,
            available=available,
            models=models,
            error=error
        ))
    
    return {"providers": statuses}


@router.get("/providers/{provider}/models")
async def get_provider_models(
    provider: str,
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key"),
    free_only: bool = False
) -> Dict[str, Any]:
    """
    Récupère les modèles disponibles pour un provider spécifique.
    
    Pour Ollama et vLLM, tente une détection automatique.
    Pour les providers cloud (OpenRouter, HuggingFace, etc.), utilise la clé API fournie.
    
    Args:
        provider: Nom du provider
        x_api_key: Clé API optionnelle (header X-Api-Key)
        free_only: Si True, retourne uniquement les modèles gratuits (OpenRouter uniquement)
        
    Returns:
        Liste des modèles (pour OpenRouter, inclut is_free)
    """
    factory = get_provider_factory()
    
    # Valider le provider
    try:
        provider_type = ProviderType(provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{provider}' non supporté"
        )
    
    # Pour OpenRouter, utiliser list_models_detailed pour avoir l'info free
    provider_class = factory._providers.get(provider_type)
    if provider_class and provider_type.value == "openrouter":
        if hasattr(provider_class, "list_models_detailed"):
            try:
                detailed_models = await provider_class.list_models_detailed(
                    api_key=x_api_key,
                    free_only=free_only
                )
                if detailed_models:
                    return {
                        "models": [m["id"] for m in detailed_models],
                        "models_detailed": detailed_models
                    }
            except Exception as e:
                logger.warning(f"Dynamic fetch failed for {provider}: {e}")
    
    # Try dynamic fetching for other providers
    if provider_class and hasattr(provider_class, "list_models"):
        try:
            dynamic_models = await provider_class.list_models(api_key=x_api_key)
            if dynamic_models:
                return {"models": dynamic_models}
        except Exception as e:
            logger.warning(f"Dynamic fetch failed for {provider}: {e}")
            
    # Sinon retourner la liste configurée (fallback)
    models = factory.get_models_for_provider(provider)
    return {"models": models}


@router.post("/providers/verify")
async def verify_provider_connection(
    request: ProviderVerificationRequest
) -> Dict[str, Any]:
    """
    Vérifie la connexion à un provider avec les credentials fournis.
    
    Tente de lister les modèles en mode strict (lève une erreur si échec).
    """
    logger.info(f"Vérification connexion pour {request.provider}")
    
    factory = get_provider_factory()
    
    # Valider le provider
    try:
        provider_type = ProviderType(request.provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{request.provider}' non supporté"
        )
        
    provider_class = factory._providers.get(provider_type)
    if not provider_class or not hasattr(provider_class, "list_models"):
        # Fallback pour les providers sans list_models (ne devrait pas arriver avec les providers actuels)
        return {
            "status": "success", 
            "message": f"Provider {request.provider} supporté (pas de vérification stricte dispo)"
        }
        
    try:
        # Tentative de listing strict
        await provider_class.list_models(api_key=request.api_key, raise_error=True)
        return {
            "status": "success",
            "message": f"Connexion réussie à {request.provider}"
        }
    except Exception as e:
        logger.warning(f"Échec vérification {request.provider}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Échec de connexion : {str(e)}"
        )


@router.get("/providers/{provider}/resilience", response_model=ResilienceConfigResponse)
async def get_provider_resilience_config(provider: str) -> ResilienceConfigResponse:
    """
    Récupère la configuration de résilience pour un provider.
    
    Args:
        provider: Nom du provider
        
    Returns:
        Configuration de résilience
    """
    config = get_resilience_config(provider.lower())
    return ResilienceConfigResponse(
        provider=provider.lower(),
        rate_limit=config.rate_limit,
        retry_enabled=config.retry_enabled,
        max_retries=config.max_retries,
        retry_base_delay=config.retry_base_delay,
        fallback_enabled=config.fallback_enabled
    )


@router.post("/providers/resilience")
async def update_provider_resilience_config(
    request: ResilienceConfigRequest
) -> Dict[str, str]:
    """
    Met à jour la configuration de résilience pour un provider.
    
    Args:
        request: Nouvelle configuration
        
    Returns:
        Message de confirmation
    """
    provider = request.provider.lower()
    
    # Créer la nouvelle config
    new_config = ResilienceConfig(
        rate_limit=request.rate_limit or 5.0,
        retry_enabled=request.retry_enabled or False,
        max_retries=request.max_retries or 3,
        fallback_enabled=request.fallback_enabled or False
    )
    
    # Appliquer
    set_resilience_config(provider, new_config)
    
    logger.info(f"Resilience config mise à jour pour {provider}: {new_config.to_dict()}")
    
    return {
        "status": "success",
        "message": f"Configuration résilience mise à jour pour {provider}"
    }


# ============================================
# Helpers - Vérification disponibilité
# ============================================

async def _check_provider_availability(
    provider: str,
    config: Dict[str, Any]
) -> bool:
    """Vérifie si un provider est accessible."""
    
    if provider == "ollama":
        host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{host}/api/tags")
                return response.status_code == 200
        except Exception:
            return False
    
    elif provider == "vllm":
        host = os.getenv("VLLM_HOST", "http://localhost:8000")
        api_key = os.getenv("VLLM_API_KEY", "token-vllm")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {"Authorization": f"Bearer {api_key}"}
                response = await client.get(f"{host}/v1/models", headers=headers)
                return response.status_code == 200
        except Exception:
            return False
    
    elif provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY")
        return bool(api_key and api_key != "your_openrouter_key_here")
    
    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        return bool(api_key and api_key != "your_openai_key_here")
    
    elif provider == "huggingface":
        api_key = os.getenv("HUGGINGFACE_API_KEY")
        return bool(api_key and api_key != "your_huggingface_key_here")
    
    return False


async def _detect_ollama_models() -> List[str]:
    """Détecte automatiquement les modèles Ollama disponibles."""
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{host}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return [m["name"] for m in data.get("models", [])]
    except Exception as e:
        logger.warning(f"Impossible de détecter modèles Ollama: {e}")
    return []


async def _detect_vllm_models() -> List[str]:
    """Détecte automatiquement les modèles vLLM servis."""
    host = os.getenv("VLLM_HOST", "http://localhost:8000")
    api_key = os.getenv("VLLM_API_KEY", "token-vllm")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            headers = {"Authorization": f"Bearer {api_key}"}
            response = await client.get(f"{host}/v1/models", headers=headers)
            if response.status_code == 200:
                data = response.json()
                return [m["id"] for m in data.get("data", [])]
    except Exception as e:
        logger.warning(f"Impossible de détecter modèles vLLM: {e}")
    return []
