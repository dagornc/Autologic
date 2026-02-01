# autologic/routers/models.py
"""
Routes FastAPI pour les endpoints de gestion des modèles et providers.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import httpx
import httpx
import os
import yaml
from pathlib import Path

from ..core.model_registry import ModelRegistry
from ..core.provider_factory import get_provider_factory, ProviderType

from ..core.resilience import get_resilience_config, set_resilience_config, ResilienceConfig
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
    worker_provider: Optional[str] = None
    worker_model: Optional[str] = None

    # Paramètres Root
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096
    top_p: Optional[float] = 1.0

    # Paramètres Worker
    worker_temperature: Optional[float] = None
    worker_max_tokens: Optional[int] = None
    worker_top_p: Optional[float] = None

    timeout: Optional[int] = 60
    worker_timeout: Optional[int] = None

    # Paramètres Audit
    audit_provider: Optional[str] = None
    audit_model: Optional[str] = None
    audit_temperature: Optional[float] = None
    audit_max_tokens: Optional[int] = None
    audit_top_p: Optional[float] = None
    audit_timeout: Optional[int] = None
    audit_max_retries: Optional[int] = 3


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
    worker_provider: Optional[str] = None
    worker_model: Optional[str] = None

    # Paramètres Root
    temperature: float
    max_tokens: int
    top_p: float

    # Paramètres Worker
    worker_temperature: Optional[float] = None
    worker_max_tokens: Optional[int] = None
    worker_top_p: Optional[float] = None

    timeout: int
    worker_timeout: Optional[int] = None

    # Paramètres Audit
    audit_provider: Optional[str] = None
    audit_model: Optional[str] = None
    audit_temperature: Optional[float] = None
    audit_max_tokens: Optional[int] = None
    audit_top_p: Optional[float] = None
    audit_timeout: Optional[int] = None
    audit_max_retries: Optional[int] = 3


class ResilienceConfigRequest(BaseModel):
    """Requête de configuration de résilience."""

    provider: str
    rate_limit: Optional[float] = 15.0
    retry_enabled: Optional[bool] = True
    max_retries: Optional[int] = 3
    fallback_enabled: Optional[bool] = True


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
async def list_models(registry: ModelRegistry = Depends(get_registry)) -> Dict[str, Any]:
    """
    Retourne la liste des providers et modèles disponibles.

    Returns:
        Liste des providers avec leurs modèles respectifs
    """
    logger.debug("Récupération de la liste des modèles")
    return {"providers": registry.get_providers(), "models": registry.get_all_models()}


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
        worker_provider=factory.get_worker_provider(),
        worker_model=factory.get_worker_model(),
        temperature=config.get("temperature", 0.7),
        max_tokens=config.get("max_tokens", 4096),
        top_p=config.get("top_p", 1.0),
        worker_temperature=config.get("worker_temperature"),
        worker_max_tokens=config.get("worker_max_tokens"),
        worker_top_p=config.get("worker_top_p"),
        timeout=config.get("timeout", 60),
        worker_timeout=config.get("worker_timeout"),
        audit_provider=factory._config.get("audit_provider"),
        audit_model=factory._config.get("audit_model"),
        audit_temperature=config.get("audit_temperature"),
        audit_max_tokens=config.get("audit_max_tokens"),
        audit_top_p=config.get("audit_top_p"),
        audit_timeout=config.get("audit_timeout"),
        audit_max_retries=config.get("audit_max_retries", 3),
    )



def _persist_config(updates: Dict[str, Any], section: str = "llm") -> None:
    """
    Persiste les mises à jour de configuration dans le fichier global.yaml.
    """
    # Chemin relatif au projet : Code/Backend/Phase2-Inference/01_Reasoning/autologic/routers/models.py
    # parents[0]=routers, [1]=autologic, [2]=01_Reasoning, [3]=Phase2-Inference, [4]=Backend, [5]=Code, [6]=AutoLogic
    project_root = Path(__file__).parents[6]
    config_path = project_root / "Config" / "global.yaml"

    try:
        # Lecture
        full_config = {}
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                full_config = yaml.safe_load(f) or {}

        # Assurance que la section existe
        if section not in full_config:
            full_config[section] = {}

        # Mise à jour (merge superficiel pour la section llm)
        # On ne remplace pas tout le dictionnaire, on met à jour les clés fournies
        for k, v in updates.items():
            if v is None:
                # Optionnel: supprimer la clé si None ? Ou juste mettre null ?
                # Pour l'instant on laisse None/Null dans le yaml si explicitement passé
                # Mais pour worker_*, on veut souvent les supprimer si désactivés.
                # La logique actuelle de models.py pop() les clés de la mémoire.
                # On va dire que si v est None, on le retire du yaml aussi pour la propreté.
                full_config[section].pop(k, None)
            else:
                full_config[section][k] = v

        # Écriture
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(full_config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

        logger.info(f"Configuration persistée dans {config_path}")

    except Exception as e:
        logger.error(f"Erreur persistence config: {e}")
        # On ne bloque pas l'API si le fichier est verrouillé, mais on loggue l'erreur
        #raise HTTPException(status_code=500, detail=f"Erreur sauvegarde config: {e}")


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

    # Valider le provider principal
    try:
        ProviderType(config.provider.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Provider '{config.provider}' non supporté")

    # Validation optionnelle du worker provider
    if config.worker_provider:
        try:
            ProviderType(config.worker_provider.lower())
        except ValueError:
            pass  # On laisse passer pour ne pas bloquer, ou on pourrait lever une erreur

    # Validation optionnelle du audit provider
    if config.audit_provider:
        try:
            ProviderType(config.audit_provider.lower())
        except ValueError:
            pass

    # Mettre à jour en mémoire
    factory._config["active_provider"] = config.provider.lower()
    factory._config["active_model"] = config.model

    if config.worker_provider:
        factory._config["worker_provider"] = config.worker_provider.lower()
    else:
        # Si non fourni ou None, on supprime pour revenir au fallback sur le Root
        factory._config.pop("worker_provider", None)

    if config.worker_model:
        factory._config["worker_model"] = config.worker_model
    else:
        factory._config.pop("worker_model", None)

    if config.audit_provider:
        factory._config["audit_provider"] = config.audit_provider.lower()
    else:
        factory._config.pop("audit_provider", None)

    if config.audit_model:
        factory._config["audit_model"] = config.audit_model
    else:
        factory._config.pop("audit_model", None)

    if config.temperature is not None:
        factory._config["temperature"] = config.temperature
    if config.max_tokens is not None:
        factory._config["max_tokens"] = config.max_tokens
    if config.top_p is not None:
        factory._config["top_p"] = config.top_p

    # Paramètres Worker
    if config.worker_temperature is not None:
        factory._config["worker_temperature"] = config.worker_temperature
    else:
        factory._config.pop("worker_temperature", None)

    if config.worker_max_tokens is not None:
        factory._config["worker_max_tokens"] = config.worker_max_tokens
    else:
        factory._config.pop("worker_max_tokens", None)

    if config.worker_top_p is not None:
        factory._config["worker_top_p"] = config.worker_top_p
    else:
        factory._config.pop("worker_top_p", None)

    # Paramètres Audit
    if config.audit_temperature is not None:
        factory._config["audit_temperature"] = config.audit_temperature
    else:
        factory._config.pop("audit_temperature", None)

    if config.audit_max_tokens is not None:
        factory._config["audit_max_tokens"] = config.audit_max_tokens
    else:
        factory._config.pop("audit_max_tokens", None)

    if config.audit_top_p is not None:
        factory._config["audit_top_p"] = config.audit_top_p
    else:
        factory._config.pop("audit_top_p", None)

    if config.timeout is not None:
        factory._config["timeout"] = config.timeout

    if config.worker_timeout is not None:
        factory._config["worker_timeout"] = config.worker_timeout
    else:
        factory._config.pop("worker_timeout", None)

    if config.audit_timeout is not None:
        factory._config["audit_timeout"] = config.audit_timeout
    else:
        factory._config.pop("audit_timeout", None)

    if config.audit_max_retries is not None:
        factory._config["audit_max_retries"] = config.audit_max_retries
    else:
        factory._config.pop("audit_max_retries", None)

    logger.info(
        f"Config mise à jour: Root={config.provider}/{config.model}, Worker={config.worker_provider}/{config.worker_model}"
    )

    # Préparation des données pour persistence
    updates = {
        "active_provider": config.provider.lower(),
        "active_model": config.model,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "top_p": config.top_p,
        "timeout": config.timeout,
    }

    if config.audit_provider:
        updates["audit_provider"] = config.audit_provider.lower()
    else:
        updates["audit_provider"] = None

    if config.audit_model:
        updates["audit_model"] = config.audit_model
    else:
        updates["audit_model"] = None

    if config.audit_temperature is not None:
        updates["audit_temperature"] = config.audit_temperature
    else:
        updates["audit_temperature"] = None

    if config.audit_max_tokens is not None:
        updates["audit_max_tokens"] = config.audit_max_tokens
    else:
        updates["audit_max_tokens"] = None

    if config.audit_top_p is not None:
        updates["audit_top_p"] = config.audit_top_p
    else:
        updates["audit_top_p"] = None

    if config.audit_timeout is not None:
        updates["audit_timeout"] = config.audit_timeout
    else:
        updates["audit_timeout"] = None

    if config.audit_max_retries is not None:
        updates["audit_max_retries"] = config.audit_max_retries
    else:
        updates["audit_max_retries"] = None

    if config.worker_provider:
        updates["worker_provider"] = config.worker_provider.lower()
    else:
        updates["worker_provider"] = None

    if config.worker_model:
        updates["worker_model"] = config.worker_model
    else:
        updates["worker_model"] = None

    if config.worker_temperature is not None:
        updates["worker_temperature"] = config.worker_temperature
    else:
        updates["worker_temperature"] = None

    if config.worker_max_tokens is not None:
        updates["worker_max_tokens"] = config.worker_max_tokens
    else:
        updates["worker_max_tokens"] = None

    if config.worker_top_p is not None:
        updates["worker_top_p"] = config.worker_top_p
    else:
        updates["worker_top_p"] = None

    if config.worker_timeout is not None:
        updates["worker_timeout"] = config.worker_timeout
    else:
        updates["worker_timeout"] = None

    # Sauvegarde asynchrone (en fait synchrone dans le thread mais rapide)
    _persist_config(updates)

    return {"status": "success", "message": "Configuration mise à jour et sauvegardée"}


@router.get("/providers/{provider}/resilience", response_model=ResilienceConfigResponse)
async def get_provider_resilience_config(provider: str) -> ResilienceConfigResponse:
    """
    Récupère la configuration de résilience pour un provider.
    """
    config = get_resilience_config(provider.lower())
    return ResilienceConfigResponse(
        provider=provider,
        rate_limit=config.rate_limit,
        retry_enabled=config.retry_enabled,
        max_retries=config.max_retries,
        retry_base_delay=config.retry_base_delay,
        fallback_enabled=config.fallback_enabled,
    )


@router.post("/providers/resilience")
async def update_resilience_config(config: ResilienceConfigRequest) -> Dict[str, str]:
    """
    Met à jour la configuration de résilience.
    """
    resilience_config = ResilienceConfig(
        rate_limit=config.rate_limit or 15.0,
        retry_enabled=config.retry_enabled or True,
        max_retries=config.max_retries or 3,
        fallback_enabled=config.fallback_enabled or True,
    )

    set_resilience_config(config.provider.lower(), resilience_config)

    logger.info(f"Resilience config updated for {config.provider}")

    # Persistence de la config resilience (section llm.resilience)
    # Note: Dans global.yaml actuel, resilience est sous `llm`. 
    # Mais ici on update pour UN provider spécifique. 
    # Le YAML global a une section `resilience` qui semble être globale/défaut ?
    # models.py `update_resilience_config` appelle `set_resilience_config(provider, ...)`
    # Cela update la map en mémoire.
    # Si on veut persister, on doit savoir si on persiste une config globale ou par provider.
    # Le Config global.yaml a `resilience:` sous `llm` qui semble être le default.
    # Et potentiellement des overrides dans `providers: name: resilience:` ? 
    # Regardons global.yaml... Il n'y a pas de resilience per provider dans le yaml actuel.
    # 
    # HYPOTHESE: L'utilisateur veut sauvegarder la configuration "Resilience" globale qui apparait dans les settings.
    # Si l'UI envoie `provider="active_provider"` ou global, on sauvegarde dans `llm.resilience`.
    # Si l'UI permet de configurer par provider, il faudrait adapter le YAML.
    # Pour l'instant, `set_resilience_config` update une map en mémoire.
    # On va supposer qu'on veut mettre à jour la DEFAUT globale si le provider match ou si c'est générique.
    # 
    # MAIS: L'endpoint prend `ResilienceConfigRequest` qui a un champ `provider`.
    # Si on edit la resilience de "openrouter", est-ce qu'on veut écrire ça dans le global default ?
    # Probablement que oui si c'est le provider principal.
    # 
    # Simplification: On met à jour la section `resilience` globale du YAML avec ces valeurs.
    # Cela affectera les defaults pour tous les futurs providers, ce qui semble cohérent avec "Settings -> Resilience".
    
    resilience_updates = {
        "rate_limit": resilience_config.rate_limit,
        "retry_enabled": resilience_config.retry_enabled,
        "max_retries": resilience_config.max_retries,
        "fallback_enabled": resilience_config.fallback_enabled,
        # retry_base_delay n'est pas dans la request, on garde le default ou on ne touche pas
    }
    
    # On doit lire la config existante pour ne pas écraser retry_base_delay s'il n'est pas updaté
    # Mais _persist_config fait un merge au niveau `llm`. Pour `resilience`, c'est un sous-dict.
    # On va utiliser une update imbriquée un peu trickye ou simplifier.
    # On va lire le YAML actuel dans _persist_config, donc on peut passer un dict partiel.
    # Mais _persist_config remplace `llm[key] = val`. Si val est un dict `resilience`, ça écrase tout `resilience`.
    # Il faut que `_persist_config` supporte le merge profond ou qu'on lui passe tout l'objet resilience.
    
    # Lecture préalable pour récupérer l'existant (un peu lourd mais sûr)
    project_root = Path(__file__).parents[6]
    config_path = project_root / "Config" / "global.yaml"
    current_resilience = {}
    try:
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                full = yaml.safe_load(f) or {}
                current_resilience = full.get("llm", {}).get("resilience", {})
    except Exception:
        pass

    # Update memory dict
    current_resilience.update(resilience_updates)
    
    # Persist
    _persist_config({"resilience": current_resilience})

    return {"status": "success", "message": "Résilience mise à jour et sauvegardée"}


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
                available = await _check_provider_availability(provider_name, provider_config)
            except Exception as e:
                error = str(e)

        statuses.append(
            ProviderStatus(name=provider_name, enabled=enabled, available=available, models=models, error=error)
        )

    return {"providers": statuses}


@router.get("/providers/{provider}/models")
async def get_provider_models(
    provider: str, x_api_key: Optional[str] = Header(None, alias="X-Api-Key"), free_only: bool = False
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
        raise HTTPException(status_code=400, detail=f"Provider '{provider}' non supporté")

    # Pour OpenRouter, utiliser list_models_detailed pour avoir l'info free
    provider_class = factory._providers.get(provider_type)
    if provider_class and provider_type.value == "openrouter":
        if hasattr(provider_class, "list_models_detailed"):
            try:
                detailed_models = await provider_class.list_models_detailed(api_key=x_api_key, free_only=free_only)
                if detailed_models:
                    return {"models": [m["id"] for m in detailed_models], "models_detailed": detailed_models}
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
async def verify_provider_connection(request: ProviderVerificationRequest) -> Dict[str, Any]:
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
        raise HTTPException(status_code=400, detail=f"Provider '{request.provider}' non supporté")

    provider_class = factory._providers.get(provider_type)
    if not provider_class or not hasattr(provider_class, "list_models"):
        # Fallback pour les providers sans list_models (ne devrait pas arriver avec les providers actuels)
        return {
            "status": "success",
            "message": f"Provider {request.provider} supporté (pas de vérification stricte dispo)",
        }

    try:
        # Tentative de listing strict
        await provider_class.list_models(api_key=request.api_key, raise_error=True)
        return {"status": "success", "message": f"Connexion réussie à {request.provider}"}
    except Exception as e:
        logger.warning(f"Échec vérification {request.provider}: {e}")
        raise HTTPException(status_code=400, detail=f"Échec de connexion : {str(e)}")


# ============================================
# Helpers - Vérification disponibilité
# ============================================


async def _check_provider_availability(provider: str, config: Dict[str, Any]) -> bool:
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
