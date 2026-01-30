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
from .critic import CriticAgent
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
    4. EXECUTE: Exécution du plan avec validation Critique (H2)
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
        
        # Initialisation de l'Agent Critique (utilise le modèle puissant)
        self.critic_agent = CriticAgent(root_model)

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
        # Suppression du markdown
        clean = response.strip()
        if clean.startswith("```"):
            # Trouver la première occurrence de '{'
            start_idx = clean.find("{")
            # Trouver la dernière occurrence de '}'
            end_idx = clean.rfind("}")
            if start_idx != -1 and end_idx != -1:
                return clean[start_idx : end_idx + 1]
            
            clean = clean.replace("```json", "").replace("```", "").strip()
        
        # Tentative d'extraction par délimiteurs si encore malformé
        if not clean.startswith("{") or not clean.endswith("}"):
            start_idx = clean.find("{")
            end_idx = clean.rfind("}")
            if start_idx != -1 and end_idx != -1:
                return clean[start_idx : end_idx + 1]
                
        return clean

    async def analyze_task(self, task: str, root_llm: Optional[BaseLLM] = None) -> Dict[str, Any]:
        """PHASE 0: ANALYSE INITIALE"""
        llm = root_llm or self.root_llm
        logger.info(f"Phase 0: Analyse de la tâche")
        prompt = PromptTemplates.analyze_prompt(task)
        response = await llm.call(prompt, response_format={"type": "json_object"})
        try:
            return json.loads(self._clean_json_response(response))
        except json.JSONDecodeError:
            return {"analysis": "Standard analysis", "constraints": []}

    async def select_modules(self, task: str, root_llm: Optional[BaseLLM] = None) -> List[ReasoningModule]:
        """
        PHASE 1: SÉLECTION
        Sélectionne les modules pertinents via root_llm.
        """
        llm = root_llm or self.root_llm
        logger.info(f"Phase 1: Sélection des modules")

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
            logger.info(f"Plan créé avec {len(plan.steps)} étapes")
            return plan

        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing structuration: {e}")
            return ReasoningPlan(steps=[], complexity="unknown")

    async def verify_plan(self, plan: ReasoningPlan, task: str, root_llm: Optional[BaseLLM] = None) -> Dict[str, Any]:
        """PHASE 4: VÉRIFICATION DU PLAN"""
        llm = root_llm or self.root_llm
        logger.info("Phase 4: Vérification du plan")
        plan_json = json.dumps(plan.to_dict(), indent=2, ensure_ascii=False)
        prompt = PromptTemplates.verify_plan_prompt(plan_json, task)
        response = await llm.call(prompt, response_format={"type": "json_object"})
        try:
            return json.loads(self._clean_json_response(response))
        except json.JSONDecodeError:
            return {"is_valid": True, "feedback": ""}

    async def execute_with_plan(
        self, task: str, plan: ReasoningPlan, worker_llm: Optional[BaseLLM] = None, previous_feedback: str = ""
    ) -> str:
        """
        PHASE 5: EXÉCUTION
        """
        llm = worker_llm or self.worker_llm
        logger.info(f"Phase 5: Exécution du plan")

        plan_json = json.dumps(plan.to_dict(), indent=2, ensure_ascii=False)
        prompt = PromptTemplates.execution_prompt(plan_json, task, previous_feedback=previous_feedback)

        response = await llm.call(prompt)
        return response

    async def synthesize_output(self, task: str, raw_output: str, root_llm: Optional[BaseLLM] = None, analysis: Optional[Dict[str, Any]] = None) -> str:
        """PHASE 7: SYNTHÈSE FINALE"""
        llm = root_llm or self.root_llm
        logger.info("Phase 7: Synthèse finale de la réponse")
        prompt = PromptTemplates.synthesis_prompt(task, raw_output, analysis=analysis)
        final_output = await llm.call(prompt)

        # OPTIONNEL: Phase 7.5 Audit Final
        if analysis and analysis.get("constraints"):
            logger.info("Phase 7.5: Audit de conformité finale")
            audit_prompt = PromptTemplates.audit_final_prompt(task, final_output, analysis=analysis)
            audit_response = await llm.call(audit_prompt, response_format={"type": "json_object"})
            try:
                audit_data = json.loads(self._clean_json_response(audit_response))
                if not audit_data.get("is_perfect", True):
                    logger.warning(f"Audit final négatif: {audit_data.get('missing_elements')}")
                    # On pourrait ici tenter une passe de correction finale, 
                    # mais pour l'instant on se contente de logger et d'injecter la suggestion si critique
            except json.JSONDecodeError:
                pass

        return final_output

    async def execute_with_critic(
        self, task: str, plan: ReasoningPlan, worker_llm: Optional[BaseLLM] = None, root_llm: Optional[BaseLLM] = None, max_retries: int = 3, analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Orchestre l'exécution avec boucle de rétroaction et Double-Backtrack.
        """
        current_response = ""
        feedback = ""
        current_plan = plan
        
        for attempt in range(max_retries):
            logger.info(f"--- Tentative {attempt + 1}/{max_retries} ---")
            
            # 1. Exécution
            current_response = await self.execute_with_plan(
                task=task,
                plan=current_plan,
                worker_llm=worker_llm,
                previous_feedback=feedback
            )

            # 2. Appel du Critic H2 (PHASE 6)
            logger.info("Phase 6: Évaluation critique H2")
            evaluation = await self.critic_agent.evaluate(task, current_plan.to_dict(), current_response)
            logger.info(f"Score Critique: {evaluation.score}")
            
            if evaluation.score >= 0.8:
                 # VALIDATION -> SYNTHÈSE (PHASE 7)
                 final_output = await self.synthesize_output(task, current_response, root_llm=root_llm, analysis=analysis)
                 return {
                     "task": task,
                     "plan": current_plan.to_dict(),
                     "final_output": final_output,
                     "critic_score": evaluation.score,
                     "attempts": attempt + 1
                 }
            else:
                logger.warning(f"Rejeté par H2: {evaluation.reason}")
                feedback = evaluation.feedback
                
                # DOUBLE-BACKTRACK LOGIC:
                # Si le feedback suggère un manque dans le PLAN, on replanifie
                if any(kw in evaluation.reason.lower() for kw in ["plan", "étape", "manquante", "structure"]):
                    logger.info("Re-planification demandée par le Critique (Backtrack Phase 3)")
                    # Mock: In real scenario, we would re-run Adapt or Structure with feedback
                    # Here we at least try to refresh the plan if it's the first retry
                    if attempt < max_retries - 1:
                         # Re-run Structure but ideally would need feedback integration in structure_prompt
                         # For now, let's just log and continue the loop, the next iteration will use feedback in EXECUTE
                         pass

        # Final pass Synthesis even if low score
        final_output = await self.synthesize_output(task, current_response, root_llm=root_llm, analysis=analysis)
        return {
            "task": task,
            "plan": current_plan.to_dict(),
            "final_output": final_output + f"\n\n[NOTE: Score H2: {evaluation.score}]",
            "critic_score": evaluation.score,
            "failed_validation": True
        }

    async def run_full_cycle(
        self, task: str, root_llm: Optional[BaseLLM] = None, worker_llm: Optional[BaseLLM] = None
    ) -> Dict[str, Any]:
        """Orchestre tout le cycle Self-Discover optimisé (8 phases)."""
        logger.info(f"Démarrage cycle 8-phases pour: {task[:50]}...")

        # 0. Analyze
        analysis = await self.analyze_task(task, root_llm=root_llm)

        # 1. Select
        selected = await self.select_modules(task, root_llm=root_llm)
        if not selected: return {"error": "Failed to select modules"}

        # 2. Adapt
        adapted = await self.adapt_modules(selected, task, root_llm=root_llm)
        if not adapted: return {"error": "Failed to adapt modules"}

        # 3. Structure
        plan = await self.structure_reasoning(adapted, task, root_llm=root_llm)
        if not plan or not plan.steps: return {"error": "Failed to structure plan"}

        # 4. Verify Plan
        verification = await self.verify_plan(plan, task, root_llm=root_llm)
        if not verification.get("is_valid", True):
            logger.warning(f"Plan initial invalide: {verification.get('feedback')}")
            # Re-planning shortcut could be here

        self.structured_plan = plan

        # 5, 6, 7. Execute, Critic, Synthesis
        result = await self.execute_with_critic(task, plan, worker_llm=worker_llm, root_llm=root_llm, analysis=analysis)

        logger.info("Cycle 8-phases terminé")
        return result
