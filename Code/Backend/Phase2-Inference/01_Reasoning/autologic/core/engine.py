# autologic/core/engine.py
"""
Moteur principal AutoLogic implémentant le cycle Self-Discovery.
Refactorisé pour utiliser les modules séparés.
"""

from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
import json
from pathlib import Path

from .models import ReasoningModule, AdaptedModule, ReasoningPlan
from .prompts import PromptTemplates
from ..utils.logging_config import get_logger

logger = get_logger(__name__)


class BaseLLM(ABC):
    """Interface abstraite pour providers LLM."""

    @abstractmethod
    async def call(self, prompt: str, **kwargs: Any) -> str:
        """
        Exécute un appel au LLM.

        Args:
            prompt: Le prompt à envoyer au LLM
            **kwargs: Arguments additionnels (response_format, etc.)

        Returns:
            La réponse du LLM en string
        """
        pass


class AutoLogicEngine:
    """
    Moteur principal AutoLogic implémentant le cycle Self-Discovery.

    Le cycle comprend 4 phases:
    1. SELECT: Sélection des modules pertinents
    2. ADAPT: Adaptation des modules au contexte
    3. STRUCTURE: Création du plan de raisonnement
    4. EXECUTE: Exécution du plan
    """

    def __init__(self, root_model: BaseLLM, worker_model: BaseLLM) -> None:
        """
        Initialise le moteur AutoLogic.

        Args:
            root_model: LLM puissant pour planification (GPT-4, Gemini Pro)
            worker_model: LLM rapide pour exécution (GPT-4o-mini, Llama 3)
        """
        self.root_llm = root_model
        self.worker_llm = worker_model
        self.reasoning_modules = self._load_39_modules()
        self.structured_plan: Optional[ReasoningPlan] = None
        self.history: List[Dict[str, Any]] = []

        logger.info(f"AutoLogicEngine initialisé avec {len(self.reasoning_modules)} modules")

    def _load_39_modules(self) -> List[ReasoningModule]:
        """Charge la bibliothèque complète des 39 modules."""
        current_dir = Path(__file__).parent
        data_path = current_dir.parent / "data" / "reasoning_modules_complete.json"

        try:
            with open(data_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            modules = [
                ReasoningModule(id=m["id"], name=m["name"], description=m["description"], category=m["category"])
                for m in data["modules"]
            ]
            logger.debug(f"Chargé {len(modules)} modules depuis {data_path}")
            return modules

        except FileNotFoundError:
            logger.warning(f"Fichier de modules non trouvé: {data_path}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Erreur de parsing JSON: {e}")
            return []

    @staticmethod
    def _clean_json_response(response: str) -> str:
        """Nettoie une réponse JSON potentiellement entourée de markdown."""
        return response.replace("```json", "").replace("```", "").strip()

    async def select_modules(self, task: str, root_llm: Optional[BaseLLM] = None) -> List[ReasoningModule]:
        """
        PHASE 1: SÉLECTION
        Sélectionne les modules pertinents via root_llm.

        Args:
            task: La tâche à résoudre
            root_llm: LLM à utiliser (override self.root_llm)

        Returns:
            Liste des modules sélectionnés
        """
        llm = root_llm or self.root_llm
        logger.info(f"Phase 1: Sélection des modules (avec {llm.__class__.__name__})")

        modules_json = json.dumps([m.to_dict() for m in self.reasoning_modules], indent=2, ensure_ascii=False)

        prompt = PromptTemplates.selection_prompt(modules_json, task)
        response = await llm.call(prompt, response_format={"type": "json_object"})

        try:
            clean_response = self._clean_json_response(response)
            selected_data = json.loads(clean_response)
            selected_ids = selected_data.get("selected_modules", [])

            selected = [m for m in self.reasoning_modules if m.id in selected_ids]
            logger.info(f"Sélectionné {len(selected)} modules: {selected_ids}")
            return selected

        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing sélection: {e}")
            return []

    async def adapt_modules(
        self, selected: List[ReasoningModule], task: str, root_llm: Optional[BaseLLM] = None
    ) -> List[AdaptedModule]:
        """
        PHASE 2: ADAPTATION
        Transforme les modules génériques en modules contextuels.

        Args:
            selected: Modules sélectionnés à adapter
            task: La tâche à résoudre

        Returns:
            Liste des modules adaptés
        """
        llm = root_llm or self.root_llm
        logger.info("Phase 2: Adaptation des modules")

        selected_json = json.dumps([m.to_dict() for m in selected], indent=2, ensure_ascii=False)

        prompt = PromptTemplates.adaptation_prompt(selected_json, task)
        response = await llm.call(prompt, response_format={"type": "json_object"})

        try:
            clean_response = self._clean_json_response(response)
            adapted_data = json.loads(clean_response)

            adapted_modules: List[AdaptedModule] = []
            for item in adapted_data.get("adapted_modules", []):
                base_module = next((m for m in selected if m.id == item["id"]), None)
                if base_module:
                    adapted_modules.append(
                        AdaptedModule(
                            base=base_module,
                            adapted_description=item["adapted_description"],
                            specific_actions=item["specific_actions"],
                        )
                    )

            logger.info(f"Adapté {len(adapted_modules)} modules")
            return adapted_modules

        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing adaptation: {e}")
            return []

    async def structure_reasoning(
        self, adapted: List[AdaptedModule], task: str, root_llm: Optional[BaseLLM] = None
    ) -> ReasoningPlan:
        """
        PHASE 3: STRUCTURATION
        Génère le plan de raisonnement structuré et ordonné.

        Args:
            adapted: Modules adaptés à utiliser
            task: La tâche à résoudre

        Returns:
            Plan de raisonnement structuré
        """
        llm = root_llm or self.root_llm
        logger.info("Phase 3: Structuration du plan")

        adapted_json = json.dumps([m.to_dict() for m in adapted], indent=2, ensure_ascii=False)

        prompt = PromptTemplates.structuration_prompt(adapted_json, task)
        response = await llm.call(prompt, response_format={"type": "json_object"})

        try:
            clean_response = self._clean_json_response(response)
            plan_data = json.loads(clean_response)
            plan_info = plan_data.get("reasoning_plan", {})

            plan = ReasoningPlan.from_dict(plan_info)
            logger.info(f"Plan créé avec {len(plan.steps)} étapes, complexité: {plan.complexity}")
            return plan

        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing structuration: {e}")
            return ReasoningPlan(steps=[], complexity="unknown")

    async def execute_with_plan(
        self, task: str, plan: ReasoningPlan, worker_llm: Optional[BaseLLM] = None
    ) -> Dict[str, Any]:
        """
        PHASE 4: EXÉCUTION
        Utilise le worker_llm pour suivre le plan.

        Args:
            task: La tâche à résoudre
            plan: Le plan de raisonnement à suivre

        Returns:
            Résultat contenant le plan et la sortie finale
        """
        llm = worker_llm or self.worker_llm
        logger.info("Phase 4: Exécution du plan")

        plan_json = json.dumps(plan.to_dict(), indent=2, ensure_ascii=False)
        prompt = PromptTemplates.execution_prompt(plan_json, task)

        response = await llm.call(prompt)

        logger.info("Exécution terminée")
        return {"task": task, "plan": plan.to_dict(), "final_output": response}

    async def run_full_cycle(
        self, task: str, root_llm: Optional[BaseLLM] = None, worker_llm: Optional[BaseLLM] = None
    ) -> Dict[str, Any]:
        """
        Orchestre tout le cycle Self-Discover.

        Args:
            task: La tâche à résoudre

        Returns:
            Résultat complet avec plan et solution
        """
        logger.info(f"Démarrage cycle complet pour: {task[:50]}...")

        # 1. Select
        selected = await self.select_modules(task, root_llm=root_llm)
        if not selected:
            return {"error": "Failed to select modules"}

        # 2. Adapt
        adapted = await self.adapt_modules(selected, task, root_llm=root_llm)
        if not adapted:
            return {"error": "Failed to adapt modules"}

        # 3. Structure
        plan = await self.structure_reasoning(adapted, task, root_llm=root_llm)
        if not plan or not plan.steps:
            return {"error": "Failed to structure plan"}

        self.structured_plan = plan

        # 4. Execute
        result = await self.execute_with_plan(task, plan, worker_llm=worker_llm)

        logger.info("Cycle complet terminé avec succès")
        return result
