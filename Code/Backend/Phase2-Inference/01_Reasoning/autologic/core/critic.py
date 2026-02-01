# autologic/core/critic.py
"""
H2 Critic Agent (Hypothesis & Heuristic Evaluator).
Agit comme un 'Gatekeeper' pour valider les réponses de l'Integrator.
"""

import json
from typing import Dict, Any, Protocol, Optional
from pydantic import BaseModel

from .prompts import PromptTemplates
from ..utils.logging_config import get_logger

logger = get_logger(__name__)


class LLMInterface(Protocol):
    """Protocol pour éviter l'import circulaire de BaseLLM."""

    async def call(self, prompt: str, **kwargs: Any) -> str: ...


class CriticEvaluation(BaseModel):
    """Modèle de sortie de l'évaluation critique."""

    score: float
    status: str  # "VALID" ou "REJECT"
    reason: str
    feedback: str


class CriticAgent:
    """
    Agent Critique H2.
    Combine heuristiques et validation LLM pour juger la qualité des réponses.
    """

    def __init__(self, llm_client: LLMInterface):
        """
        Initialise l'agent critique.

        Args:
            llm_client: Le LLM à utiliser pour l'évaluation (Juge)
        """
        self.llm = llm_client

    def _heuristic_check(self, task: str, response: str) -> Optional[CriticEvaluation]:
        """
        Vérifications heuristiques rapides (règles strictes).
        Retourne une évaluation si rejet, sinon None (passe au LLM).
        """
        # Règle 1: Hallucination "API Google Antigravity"
        # Si la réponse mentionne une API Antigravity comme si elle existait
        input_lower = task.lower()
        response_lower = response.lower()

        # Si l'utilisateur NE demandait PAS une fiction ou un easter egg, et qu'on voit des termes suspects
        if (
            "easter egg" not in input_lower
            and "google gravity" not in input_lower
            and "game" not in input_lower
        ):
            fake_terms = ["google.physics", "import antigravity", "setgravity("]
            for term in fake_terms:
                if term in response_lower:
                    logger.warning(f"Heuristic REJECT: Detected fake term '{term}'")
                    return CriticEvaluation(
                        score=0.1,
                        status="REJECT",
                        reason=f"Détection heuristique: Terme suspect '{term}' suggère une hallucination d'API inexistante.",
                        feedback="Google ne possède pas d'API publique d'antigravité physique. Ne pas inventer de code ou d'imports. Vérifie s'il s'agit de simulation (MuJoCo) ou de l'Easter Egg.",
                    )

        # Règle 2: Réponse vide ou trop courte
        if len(response.strip()) < 50:
            return CriticEvaluation(
                score=0.2,
                status="REJECT",
                reason="Réponse trop courte ou vide.",
                feedback="La réponse est insuffisante. Développe le contenu pour répondre au plan.",
            )

        return None

    def _clean_json_response(self, response: str) -> str:
        """Nettoie le markdown JSON."""
        return response.replace("```json", "").replace("```", "").strip()

    async def evaluate(
        self, task: str, plan: Dict[str, Any], response: str
    ) -> CriticEvaluation:
        """
        Évalue une réponse candidate.

        Args:
            task: La tâche utilisateur
            plan: Le plan AutoLogic (dict)
            response: La réponse générée

        Returns:
            Résultat de l'évaluation
        """
        # 1. Heuristiques
        heuristic_result = self._heuristic_check(task, response)
        if heuristic_result:
            return heuristic_result

        # 2. LLM Judge
        plan_str = json.dumps(plan, indent=2, ensure_ascii=False)
        prompt = PromptTemplates.critic_evaluation_prompt(task, plan_str, response)

        try:
            # On demande un format JSON
            llm_response = await self.llm.call(
                prompt, response_format={"type": "json_object"}
            )
            clean_resp = self._clean_json_response(llm_response)
            data = json.loads(clean_resp)

            return CriticEvaluation(
                score=float(data.get("score_h2", data.get("score", 0.0))),
                status=data.get("status", "REJECT"),
                reason=data.get(
                    "feedback", "Pas de raison fournie"
                ),  # Mapping feedback to reason as prompt doesn't strictly ask for 'reason' field anymore in output json example
                feedback=data.get("feedback", "Refaire la réponse en suivant le plan."),
            )

        except Exception as e:
            logger.error(f"Erreur lors de l'évaluation critique: {e}")
            # Fallback fail-safe: En cas d'erreur du critique, on rejette par prudence
            # ou on accepte si on veut être tolérant. Ici on rejette pour forcer la robustesse.
            return CriticEvaluation(
                score=0.0,
                status="ERROR",
                reason=f"Crash du critique: {str(e)}",
                feedback="Une erreur interne est survenue lors de la validation. Vérifier le format et réessayer.",
            )
