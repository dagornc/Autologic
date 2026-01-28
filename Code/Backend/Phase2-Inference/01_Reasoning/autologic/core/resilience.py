# autologic/core/resilience.py
"""
Module de résilience pour les providers LLM.

Implémente:
- RateLimiter: Token bucket pour limiter les requêtes/seconde
- ResilienceConfig: Configuration de résilience
- ResilientCaller: Wrapper avec retry et fallback
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, Callable, List, Optional, TypeVar
from functools import wraps

from ..utils.logging_config import get_logger

logger = get_logger(__name__)

T = TypeVar('T')


@dataclass
class ResilienceConfig:
    """Configuration de résilience pour un provider."""
    
    rate_limit: float = 5.0  # Requêtes par seconde
    retry_enabled: bool = False
    max_retries: int = 3
    retry_base_delay: float = 1.0  # Délai de base pour backoff exponentiel
    fallback_enabled: bool = False
    
    def to_dict(self) -> dict:
        """Convertit en dictionnaire."""
        return {
            "rate_limit": self.rate_limit,
            "retry_enabled": self.retry_enabled,
            "max_retries": self.max_retries,
            "retry_base_delay": self.retry_base_delay,
            "fallback_enabled": self.fallback_enabled
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "ResilienceConfig":
        """Crée depuis un dictionnaire."""
        return cls(
            rate_limit=data.get("rate_limit", 5.0),
            retry_enabled=data.get("retry_enabled", False),
            max_retries=data.get("max_retries", 3),
            retry_base_delay=data.get("retry_base_delay", 1.0),
            fallback_enabled=data.get("fallback_enabled", False)
        )


class RateLimiter:
    """
    Token bucket rate limiter.
    
    Limite le nombre de requêtes par seconde en utilisant
    l'algorithme du seau à jetons (token bucket).
    """
    
    def __init__(self, requests_per_second: float = 5.0):
        """
        Initialise le rate limiter.
        
        Args:
            requests_per_second: Nombre max de requêtes par seconde
        """
        self._rate = requests_per_second
        self._tokens = requests_per_second
        self._last_update = time.monotonic()
        self._lock = asyncio.Lock()
        
    @property
    def rate(self) -> float:
        """Retourne le taux actuel."""
        return self._rate
    
    def set_rate(self, requests_per_second: float) -> None:
        """Met à jour le taux de requêtes."""
        self._rate = max(0.1, requests_per_second)  # Minimum 0.1 req/s
        logger.info(f"RateLimiter: taux mis à jour à {self._rate} req/s")
        
    async def acquire(self) -> None:
        """
        Acquiert un token, bloque si nécessaire.
        
        Cette méthode est thread-safe et attend qu'un token
        soit disponible avant de retourner.
        """
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_update
            
            # Ajouter des tokens basés sur le temps écoulé
            self._tokens = min(
                self._rate,  # Cap à rate (burst max = 1 seconde)
                self._tokens + elapsed * self._rate
            )
            self._last_update = now
            
            if self._tokens < 1:
                # Calculer le temps d'attente nécessaire
                wait_time = (1 - self._tokens) / self._rate
                logger.debug(f"RateLimiter: attente de {wait_time:.3f}s")
                await asyncio.sleep(wait_time)
                self._tokens = 0
            else:
                self._tokens -= 1


class RetryableError(Exception):
    """Exception indiquant qu'un retry est possible."""
    
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class ModelSaturatedError(Exception):
    """Exception indiquant que le modèle est saturé (pour fallback)."""
    pass


class DataPolicyError(Exception):
    """
    Exception spécifique aux erreurs de politique de données OpenRouter.
    
    Cette erreur survient quand l'utilisateur n'a pas configuré ses
    paramètres de confidentialité pour autoriser les modèles gratuits.
    """
    
    def __init__(self, message: str, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.original_error = original_error


class ResilientCaller:
    """
    Wrapper qui applique rate limiting, retry et fallback.
    
    Utilisation:
        caller = ResilientCaller(config, rate_limiter)
        result = await caller.call(my_async_func, fallback_func)
    """
    
    # Codes HTTP qui déclenchent un retry
    RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
    
    # Codes HTTP qui déclenchent un fallback (inclut 404 pour data policy errors)
    FALLBACK_STATUS_CODES = {404, 429, 500, 502, 503, 504}
    
    # Messages d'erreur spécifiques OpenRouter qui nécessitent un fallback
    OPENROUTER_FALLBACK_MESSAGES = [
        "no endpoints found",
        "data policy",
        "model not available",
        "model is currently overloaded",
        "model unavailable",
    ]
    
    def __init__(
        self,
        config: ResilienceConfig,
        rate_limiter: Optional[RateLimiter] = None
    ):
        """
        Initialise le caller résilient.
        
        Args:
            config: Configuration de résilience
            rate_limiter: Rate limiter partagé (optionnel)
        """
        self._config = config
        self._rate_limiter = rate_limiter or RateLimiter(config.rate_limit)
        
    @property
    def config(self) -> ResilienceConfig:
        """Retourne la configuration."""
        return self._config
    
    def update_config(self, config: ResilienceConfig) -> None:
        """Met à jour la configuration."""
        self._config = config
        self._rate_limiter.set_rate(config.rate_limit)
        
    async def call(
        self,
        func: Callable[..., Any],
        *args: Any,
        fallback_func: Optional[Callable[..., Any]] = None,
        **kwargs: Any
    ) -> Any:
        """
        Exécute une fonction avec rate limiting, retry et fallback.
        
        Args:
            func: Fonction async à exécuter
            *args: Arguments positionnels
            fallback_func: Fonction de fallback (optionnelle)
            **kwargs: Arguments nommés
            
        Returns:
            Résultat de la fonction
            
        Raises:
            Exception: Si tous les retries et le fallback échouent
        """
        # Rate limiting
        await self._rate_limiter.acquire()
        
        last_exception: Optional[Exception] = None
        attempts = 1 if not self._config.retry_enabled else self._config.max_retries + 1
        
        for attempt in range(attempts):
            try:
                return await func(*args, **kwargs)
                
            except Exception as e:
                last_exception = e
                is_retryable = self._is_retryable_error(e)
                should_fallback = self._should_fallback(e)
                
                # Log l'erreur parsée pour l'utilisateur
                parsed_error = self.parse_openrouter_error(e)
                logger.warning(f"ResilientCaller: {parsed_error}")
                
                # Si l'erreur n'est ni retryable ni fallbackable, la relever
                if not is_retryable and not should_fallback:
                    raise
                
                # Si l'erreur n'est pas retryable mais doit faire fallback, sortir de la boucle
                if not is_retryable and should_fallback:
                    logger.info(
                        f"ResilientCaller: Erreur non-retryable mais fallback possible: {e}"
                    )
                    break
                
                if attempt < attempts - 1:
                    # Backoff exponentiel
                    delay = self._config.retry_base_delay * (2 ** attempt)
                    logger.warning(
                        f"ResilientCaller: Erreur {e}, retry {attempt + 1}/{attempts} "
                        f"dans {delay:.1f}s"
                    )
                    await asyncio.sleep(delay)
                    # Re-acquire rate limit token pour le retry
                    await self._rate_limiter.acquire()
        
        # Tous les retries ont échoué ou erreur nécessitant fallback
        logger.error(f"ResilientCaller: Tous les retries ont échoué: {last_exception}")
        
        # Tenter le fallback si configuré ET si l'erreur le justifie
        if self._config.fallback_enabled and fallback_func and self._should_fallback(last_exception):
            logger.info("ResilientCaller: Tentative de fallback...")
            try:
                await self._rate_limiter.acquire()
                return await fallback_func(*args, **kwargs)
            except Exception as fallback_error:
                logger.error(f"ResilientCaller: Fallback échoué: {fallback_error}")
                # Lever l'erreur originale avec message parsé
                raise last_exception from fallback_error
        
        # Pas de fallback, lever l'erreur
        if last_exception:
            raise last_exception
        raise RuntimeError("Erreur inconnue dans ResilientCaller")
    
    def _is_retryable_error(self, error: Exception) -> bool:
        """Vérifie si une erreur est retryable."""
        error_str = str(error).lower()
        
        # Vérifier les codes status HTTP
        for code in self.RETRYABLE_STATUS_CODES:
            if str(code) in error_str:
                return True
        
        # Vérifier les messages d'erreur courants
        retryable_messages = [
            "rate limit",
            "too many requests",
            "service unavailable",
            "timeout",
            "connection",
            "overloaded",
            "capacity"
        ]
        
        return any(msg in error_str for msg in retryable_messages)
    
    def _should_fallback(self, error: Exception) -> bool:
        """
        Vérifie si une erreur doit déclencher un fallback.
        
        Inclut les erreurs 404 (data policy), les erreurs de modèle
        indisponible, et autres erreurs OpenRouter spécifiques.
        """
        error_str = str(error).lower()
        
        # Vérifier les codes status HTTP pour fallback
        for code in self.FALLBACK_STATUS_CODES:
            if str(code) in error_str:
                return True
        
        # Vérifier les messages OpenRouter spécifiques
        return any(msg in error_str for msg in self.OPENROUTER_FALLBACK_MESSAGES)
    
    @staticmethod
    def parse_openrouter_error(error: Exception) -> str:
        """
        Parse une erreur OpenRouter pour fournir un message utilisateur clair.
        
        Args:
            error: L'exception originale
            
        Returns:
            Message d'erreur explicite en français
        """
        error_str = str(error).lower()
        
        if "no endpoints found" in error_str and "data policy" in error_str:
            return (
                "Erreur de politique de données OpenRouter: Les modèles gratuits "
                "nécessitent d'autoriser le partage de données. "
                "Configurez vos paramètres sur https://openrouter.ai/settings/privacy"
            )
        
        if "404" in error_str:
            if "data policy" in error_str or "no endpoints" in error_str:
                return (
                    "Modèle indisponible (erreur 404): Vérifiez vos paramètres de "
                    "confidentialité OpenRouter pour les modèles gratuits."
                )
            return f"Modèle non trouvé (erreur 404): {error}"
        
        if "429" in error_str:
            return "Limite de requêtes atteinte. Réessayez dans quelques instants."
        
        if "timeout" in error_str:
            return "Le modèle met trop de temps à répondre. Essayez un autre modèle."
        
        if "overloaded" in error_str or "capacity" in error_str:
            return "Le modèle est surchargé. Un fallback vers un autre modèle sera tenté."
        
        return str(error)


# Singleton des rate limiters par provider
_rate_limiters: dict[str, RateLimiter] = {}
_resilience_configs: dict[str, ResilienceConfig] = {}


def get_rate_limiter(provider: str) -> RateLimiter:
    """Récupère ou crée un rate limiter pour un provider."""
    if provider not in _rate_limiters:
        config = get_resilience_config(provider)
        _rate_limiters[provider] = RateLimiter(config.rate_limit)
    return _rate_limiters[provider]


def get_resilience_config(provider: str) -> ResilienceConfig:
    """Récupère la config de résilience pour un provider."""
    if provider not in _resilience_configs:
        _resilience_configs[provider] = ResilienceConfig()
    return _resilience_configs[provider]


def set_resilience_config(provider: str, config: ResilienceConfig) -> None:
    """Met à jour la config de résilience pour un provider."""
    _resilience_configs[provider] = config
    
    # Mettre à jour le rate limiter si existant
    if provider in _rate_limiters:
        _rate_limiters[provider].set_rate(config.rate_limit)
    
    logger.info(f"Resilience config updated for {provider}: {config.to_dict()}")


def get_resilient_caller(provider: str) -> ResilientCaller:
    """Crée un ResilientCaller pour un provider."""
    config = get_resilience_config(provider)
    rate_limiter = get_rate_limiter(provider)
    return ResilientCaller(config, rate_limiter)
