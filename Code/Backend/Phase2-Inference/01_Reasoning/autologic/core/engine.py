# autologic/core/engine.py
"""
Moteur principal AutoLogic implémentant le cycle Self-Discovery.
Refactorisé pour utiliser les modules séparés.
"""

from typing import List, Dict, Any, Optional, Callable, Awaitable
from abc import ABC, abstractmethod
import json
from pathlib import Path

from .models import ReasoningModule, AdaptedModule, ReasoningPlan
from .prompts import PromptTemplates
from .critic import CriticAgent
from ..utils.logging_config import get_logger
import time

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

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Retourne le nom du modèle."""
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

    def __init__(
        self,
        root_model: BaseLLM,
        worker_model: BaseLLM,
        audit_model: Optional[BaseLLM] = None,
        progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
    ) -> None:
        """
        Initialise le moteur AutoLogic.

        Args:
            root_model: LLM puissant pour planification (GPT-4, Gemini Pro)
            worker_model: LLM rapide pour exécution (GPT-4o-mini, Llama 3)
            audit_model: LLM dédié à l'audit (optionnel, fallback sur root_model)
            progress_callback: Fonction async pour émettre des événements de progression
        """
        self.root_llm = root_model
        self.worker_llm = worker_model
        self.audit_llm = audit_model or root_model
        self.reasoning_modules = self._load_modules()
        self.structured_plan: Optional[ReasoningPlan] = None
        self.history: List[Dict[str, Any]] = []
        self.progress_callback = progress_callback

        # Initialisation de l'Agent Critique (utilise le modèle puissant)
        self.critic_agent = CriticAgent(root_model)

        logger.info(
            f"AutoLogicEngine initialisé avec {len(self.reasoning_modules)} modules"
        )

    async def _emit_progress(self, stage: str, status: str = "active", message: str = "", model_name: str = ""):
        """Helper pour émettre un événement de progression."""
        if self.progress_callback:
            event = {
                "stage": stage,
                "status": status,
                "message": message,
                "model": model_name,
                "timestamp": time.time()
            }
            await self.progress_callback(event)

    def _load_modules(self) -> List[ReasoningModule]:
        """Charge la bibliothèque complète des modules."""
        current_dir = Path(__file__).parent
        data_path = current_dir.parent / "data" / "reasoning_modules_complete.json"

        try:
            with open(data_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            modules = [
                ReasoningModule(
                    id=m["id"],
                    name=m["name"],
                    description=m["description"],
                    category=m["category"],
                )
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

    def _compute_dynamic_timeout(
        self, base_timeout: int, complexity: str, steps_count: int
    ) -> int:
        """
        Calcule un timeout adapté à la complexité de la tâche.

        Args:
            base_timeout: Timeout de base en secondes
            complexity: Niveau de complexité (low, medium, high, unknown)
            steps_count: Nombre d'étapes dans le plan

        Returns:
            Timeout ajusté en secondes
        """
        multipliers = {"low": 1.0, "medium": 1.5, "high": 2.5, "unknown": 1.5}
        mult = multipliers.get(complexity.lower(), 1.5)
        # +10s par étape au-delà de 5
        extra_steps = max(0, steps_count - 5) * 10
        result = int(base_timeout * mult + extra_steps)
        logger.debug(
            f"Dynamic timeout: base={base_timeout}, complexity={complexity}, "
            f"steps={steps_count} -> {result}s"
        )
        return result

    @staticmethod
    def _is_confused_output(output: str) -> bool:
        """
        Détecte si la sortie du LLM est une réponse "confuse" plutôt qu'un contenu utile.

        Args:
            output: La sortie à vérifier

        Returns:
            True si la sortie semble être une confusion du LLM
        """
        confusion_markers = [
            "je n'ai pas de contenu",
            "merci de fournir",
            "élément requis",
            "je comprends que vous souhaitez",
            "je ne peux pas",
            "veuillez préciser",
            "information manquante",
        ]
        output_lower = output.lower()
        return any(marker in output_lower for marker in confusion_markers)

    @staticmethod
    def _clean_json_response(response: str) -> str:
        """Nettoie une réponse JSON potentiellement entourée de markdown ou de tags de raisonnement."""
        # Suppression des tags de raisonnement type <think>...</think>
        clean = response.strip()
        import re
        clean = re.sub(r'<think>.*?</think>', '', clean, flags=re.DOTALL).strip()

        # Suppression du markdown
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

    async def _call_and_parse_json(
        self,
        prompt: str,
        llm: BaseLLM,
        method_name: str,
        retries: int = 3,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Helper method to call LLM and parse JSON with retries.
        """
        response_format = response_format or {"type": "json_object"}
        last_error: Optional[Exception] = None

        for attempt in range(retries):
            try:
                response = await llm.call(prompt, response_format=response_format)
                clean_response = self._clean_json_response(response)
                return json.loads(clean_response)
            except json.JSONDecodeError as e:
                last_error = e
                logger.warning(
                    f"{method_name}: JSON parsing failed (attempt {attempt + 1}/{retries}): {e}\nRaw Response preview: {response[:500]}..."
                )
                # Optional: You could append a "Please fix JSON" instruction to the prompt here for next retry
            except Exception as e:
                # Catch other potential errors (like network/provider issues handled by ResilientCaller,
                # but good to be safe if they bubble up as something else or if we want to log context)
                last_error = e
                logger.warning(
                    f"{method_name}: LLM call failed (attempt {attempt + 1}/{retries}): {e}"
                )

        logger.error(f"{method_name}: Failed to parse JSON after {retries} attempts")
        if last_error:
            raise last_error
        raise RuntimeError(f"{method_name}: Unknown error during JSON parsing")

    async def analyze_task(
        self, task: str, root_llm: Optional[BaseLLM] = None
    ) -> Dict[str, Any]:
        """PHASE 0: ANALYSE INITIALE"""
        llm = root_llm or self.root_llm
        logger.info("Phase 0: Analyse de la tâche")
        await self._emit_progress("Analyzing", "active", "Analyzing intent and constraints...", llm.model_name)
        
        prompt = PromptTemplates.analyze_prompt(task)

        try:
            result = await self._call_and_parse_json(prompt, llm, "analyze_task")
            await self._emit_progress("Analyzing", "completed", "Analysis complete", llm.model_name)
            return result
        except Exception:
            # Fallback simple
            await self._emit_progress("Analyzing", "completed", "Detailed analysis skipped")
            return {"analysis": "Standard analysis", "constraints": []}

    async def select_modules(
        self, task: str, root_llm: Optional[BaseLLM] = None
    ) -> List[ReasoningModule]:
        """
        PHASE 1: SÉLECTION
        Sélectionne les modules pertinents via root_llm.
        """
        llm = root_llm or self.root_llm
        logger.info("Phase 1: Sélection des modules")
        await self._emit_progress("Selecting", "active", "Selecting best reasoning modules...", llm.model_name)

        modules_json = json.dumps(
            [m.to_dict() for m in self.reasoning_modules], indent=2, ensure_ascii=False
        )

        prompt = PromptTemplates.selection_prompt(modules_json, task)

        try:
            selected_data = await self._call_and_parse_json(
                prompt, llm, "select_modules"
            )
            selected_ids = selected_data.get("selected_modules", [])

            selected = [m for m in self.reasoning_modules if m.id in selected_ids]
            logger.info(f"Sélectionné {len(selected)} modules: {selected_ids}")
            
            logger.info(f"Sélectionné {len(selected)} modules: {selected_ids}")
            
            await self._emit_progress("Selecting", "completed", f"Selected {len(selected)} modules", llm.model_name)
            return selected

        except Exception as e:
            logger.error(f"Erreur sélection modules après retries: {e}")
            logger.warning("Activation du Fallback: Sélection des modules par défaut")
            
            fallback_ids = ["decomposer_le_probleme", "identifier_les_contraintes", "brainstorming"]
            fallback_modules = [m for m in self.reasoning_modules if m.id in fallback_ids]
            
            await self._emit_progress("Selecting", "completed", "Fallback to default modules (Connection Error)")
            return fallback_modules

    async def adapt_modules(
        self,
        selected: List[ReasoningModule],
        task: str,
        root_llm: Optional[BaseLLM] = None,
    ) -> List[AdaptedModule]:
        """
        PHASE 2: ADAPTATION
        """
        llm = root_llm or self.root_llm
        logger.info("Phase 2: Adaptation des modules")
        await self._emit_progress("Adapting", "active", "Adapting modules to context...", llm.model_name)

        selected_json = json.dumps(
            [m.to_dict() for m in selected], indent=2, ensure_ascii=False
        )

        prompt = PromptTemplates.adaptation_prompt(selected_json, task)

        try:
            adapted_data = await self._call_and_parse_json(prompt, llm, "adapt_modules")

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
            logger.info(f"Adapté {len(adapted_modules)} modules")
            await self._emit_progress("Adapting", "completed", "Modules adapted", llm.model_name)
            return adapted_modules

        except Exception as e:
            logger.error(f"Erreur adaptation modules après retries: {e}")
            logger.warning("Activation du Fallback: Utilisation des descriptions génériques")
            
            fallback_adapted = [
                AdaptedModule(
                    base=m,
                    adapted_description=m.description,
                    specific_actions=[]
                )
                for m in selected
            ]
            
            await self._emit_progress("Adapting", "completed", "Fallback to generic descriptions (Error during adaptation)")
            return fallback_adapted

    async def structure_reasoning(
        self,
        adapted: List[AdaptedModule],
        task: str,
        root_llm: Optional[BaseLLM] = None,
    ) -> ReasoningPlan:
        """
        PHASE 3: STRUCTURATION
        """
        llm = root_llm or self.root_llm
        logger.info("Phase 3: Structuration du plan")
        await self._emit_progress("Structuring", "active", "Building execution plan...", llm.model_name)

        adapted_json = json.dumps(
            [m.to_dict() for m in adapted], indent=2, ensure_ascii=False
        )

        prompt = PromptTemplates.structuration_prompt(adapted_json, task)

        try:
            plan_data = await self._call_and_parse_json(
                prompt, llm, "structure_reasoning"
            )
            plan_info = plan_data.get("reasoning_plan", {})

            plan = ReasoningPlan.from_dict(plan_info)
            logger.info(f"Plan créé avec {len(plan.steps)} étapes")
            plan = ReasoningPlan.from_dict(plan_info)
            logger.info(f"Plan créé avec {len(plan.steps)} étapes")
            await self._emit_progress("Structuring", "completed", f"Plan created with {len(plan.steps)} steps", llm.model_name)
            return plan

        except Exception as e:
            logger.error(f"Erreur structuration plan après retries: {e}")
            await self._emit_progress("Structuring", "error", "Failed to structure plan")
            return ReasoningPlan(steps=[], complexity="unknown")

    async def verify_plan(
        self, plan: ReasoningPlan, task: str, root_llm: Optional[BaseLLM] = None
    ) -> Dict[str, Any]:
        """PHASE 4: VÉRIFICATION DU PLAN"""
        llm = root_llm or self.root_llm
        logger.info("Phase 4: Vérification du plan")
        await self._emit_progress("Verifying", "active", "Verifying plan validity...", llm.model_name)
        
        plan_json = json.dumps(plan.to_dict(), indent=2, ensure_ascii=False)
        prompt = PromptTemplates.verify_plan_prompt(plan_json, task)

        try:
            result = await self._call_and_parse_json(prompt, llm, "verify_plan")
            result = await self._call_and_parse_json(prompt, llm, "verify_plan")
            await self._emit_progress("Verifying", "completed", "Plan verified", llm.model_name)
            return result
        except Exception:
            await self._emit_progress("Verifying", "completed", "Validation skipped")
            return {"is_valid": True, "feedback": ""}

    async def restructure_plan(
        self,
        old_plan: ReasoningPlan,
        task: str,
        feedback: str,
        root_llm: Optional[BaseLLM] = None,
    ) -> ReasoningPlan:
        """
        PHASE 3b: RE-STRUCTURATION (Double-Backtrack)
        Régénère un plan basé sur le feedback critique.
        """
        llm = root_llm or self.root_llm
        logger.info("Phase 3b: Restructuration du plan (Correction)")
        await self._emit_progress("Structuring", "active", "Refining plan based on feedback...", llm.model_name)

        old_plan_json = json.dumps(old_plan.to_dict(), indent=2, ensure_ascii=False)
        prompt = PromptTemplates.restructure_prompt(old_plan_json, task, feedback)

        try:
            plan_data = await self._call_and_parse_json(prompt, llm, "restructure_plan")
            plan_info = plan_data.get("reasoning_plan", {})
            new_plan = ReasoningPlan.from_dict(plan_info)
            logger.info(f"Plan restructuré avec {len(new_plan.steps)} étapes")
            return new_plan
        except Exception as e:
            logger.error(f"Echec restructuration plan: {e}")
            return old_plan  # Fallback sur l'ancien si échec

    async def execute_with_plan(
        self,
        task: str,
        plan: ReasoningPlan,
        worker_llm: Optional[BaseLLM] = None,
        previous_feedback: str = "",
    ) -> str:
        """
        PHASE 5: EXÉCUTION
        """
        llm = worker_llm or self.worker_llm
        logger.info("Phase 5: Exécution du plan")
        await self._emit_progress("Executing", "active", "Executing reasoning steps...", llm.model_name)

        plan_json = json.dumps(plan.to_dict(), indent=2, ensure_ascii=False)
        prompt = PromptTemplates.execution_prompt(
            plan_json, task, previous_feedback=previous_feedback
        )

        response = await llm.call(prompt)
        await self._emit_progress("Executing", "completed", "Execution finished", llm.model_name)
        return response

    async def synthesize_output(
        self,
        task: str,
        raw_output: str,
        root_llm: Optional[BaseLLM] = None,
        audit_llm: Optional[BaseLLM] = None,
        analysis: Optional[Dict[str, Any]] = None,
        audit_timeout: int = 60,
        audit_max_retries: int = 5,
        plan_complexity: str = "medium",
        plan_steps_count: int = 5,
    ) -> str:
        """
        PHASE 7 & 7.5: SYNTHÈSE & AUDIT ITÉRATIF
        Affine la réponse finale avec une boucle d'audit time-boxed.

        Args:
            task: La tâche originale
            raw_output: La sortie brute de l'exécution
            root_llm: LLM pour la synthèse
            audit_llm: LLM pour l'audit
            analysis: Analyse initiale avec contraintes
            audit_timeout: Timeout de base pour l'audit (auto-ajusté)
            audit_max_retries: Nombre max de passes d'audit
            plan_complexity: Complexité du plan (low/medium/high)
            plan_steps_count: Nombre d'étapes dans le plan
        """
        # Phase 7: Synthèse (Strategic Model)
        synthesis_llm = root_llm or self.root_llm
        audit_llm = audit_llm or self.audit_llm

        # Calcul du timeout dynamique
        effective_timeout = self._compute_dynamic_timeout(
            audit_timeout, plan_complexity, plan_steps_count
        )

        logger.info("Phase 7: Synthèse finale de la réponse")
        await self._emit_progress("Synthesizing", "active", "Synthesizing final output...", synthesis_llm.model_name)
        
        prompt = PromptTemplates.synthesis_prompt(task, raw_output, analysis=analysis)
        current_output = await synthesis_llm.call(prompt)

        # Détection de sortie confuse - fallback sur raw_output
        if self._is_confused_output(current_output):
            logger.warning("Synthèse confuse détectée - fallback sur raw_output")
            current_output = raw_output

        # Si pas de contraintes, on retourne direct
        if not (analysis and analysis.get("constraints")):
            await self._emit_progress("Synthesizing", "completed", "Synthesis complete", synthesis_llm.model_name)
            return current_output

        # Phase 7.5: Boucle d'Audit (Universelle) - Utilise le modèle d'Audit dédié
        logger.info(
            f"Phase 7.5: Audit Universel (Timeout Effectif: {effective_timeout}s, Max Retries: {audit_max_retries}, Model: {audit_llm.__class__.__name__})"
        )
        await self._emit_progress("Auditing", "active", "Auditing response against constraints...", audit_llm.model_name)

        start_time = time.time()
        iteration = 0
        max_iterations = audit_max_retries

        while True:
            # Check Timeout (Force Proceed logic - Universal)
            elapsed = time.time() - start_time
            if elapsed > effective_timeout:
                logger.warning(
                    f"Audit Global Timeout: Force Proceed après {elapsed:.1f}s (limite: {effective_timeout}s)"
                )
                await self._emit_progress("Auditing", "completed", "Audit timeout - finalizing", audit_llm.model_name)
                # Retourner le contenu sans annotation de timeout si le contenu est valide
                return current_output

            if iteration >= max_iterations:
                logger.warning("Audit: Max iterations rounded")
                break

            # Appel Audit Universel (via Audit LLM)
            audit_prompt = PromptTemplates.audit_final_prompt(
                task, current_output, analysis=analysis
            )
            try:
                # Utilisation du modèle d'audit pour la vérification
                await self._emit_progress("Auditing", "active", f"Audit pass {iteration + 1}...", audit_llm.model_name)
                
                audit_data = await self._call_and_parse_json(
                    audit_prompt, audit_llm, "audit_final", retries=2
                )

                score = audit_data.get("structural_sufficiency_score", 0)
                is_sufficient = audit_data.get("is_sufficient", False)
                change_type = audit_data.get("required_changes_type", "MAJOR")
                missing = audit_data.get("missing_critical_elements", [])

                logger.info(
                    f"Audit #{iteration+1}: Score={score}, Sufficient={is_sufficient}, Type={change_type}"
                )

                # Critère 1: Suffisance Structurelle (90%)
                if is_sufficient or score >= 90:
                    logger.info("Audit Validé : Suffisance structurelle atteinte")
                    break

                # Critère 2: Loi Rendement Décroissant (Minor Changes)
                if change_type == "MINOR" or change_type == "NONE":
                    logger.info(
                        "Audit Validé : Modifications mineures ignorées (Rendement Décroissant)"
                    )
                    break

                # Critère 3: Stagnation (2 passes Max pour ajustements majeurs si pas de progrès clair)
                # (Implémenté ici via max_iterations, mais on pourrait être plus strict)

                # Si instructions d'amélioration MAJEURES -> RAFFINEMENT (via Synthesis LLM)
                instructions = audit_data.get(
                    "improvement_instructions", "Corriger les éléments manquants."
                )
                # Utilisation du template centralisé avec contexte complet
                refine_prompt = PromptTemplates.refine_prompt(
                    task=task,
                    current_output=current_output,
                    instructions=instructions,
                    missing_elements=missing,
                )

                # Utilisation du modèle de synthèse pour la correction
                refined_output = await synthesis_llm.call(refine_prompt)
                
                # Vérifier que le raffinement n'est pas confus
                if not self._is_confused_output(refined_output):
                    current_output = refined_output
                else:
                    logger.warning("Raffinement confus détecté - conservation de la version précédente")
                
                iteration += 1

            except Exception as e:
                logger.error(f"Erreur durant l'audit: {e}")
                break

        await self._emit_progress("Auditing", "completed", "Audit passed", audit_llm.model_name)
        return current_output

    async def execute_with_critic(
        self,
        task: str,
        plan: ReasoningPlan,
        worker_llm: Optional[BaseLLM] = None,
        root_llm: Optional[BaseLLM] = None,
        audit_llm: Optional[BaseLLM] = None,
        max_retries: int = 3,
        analysis: Optional[Dict[str, Any]] = None,
        audit_timeout: int = 30,
        audit_max_retries: int = 3,
        reasoning_modes: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Orchestre l'exécution avec boucle de rétroaction et Double-Backtrack.
        """
        current_response = ""
        feedback = ""
        current_plan = plan
        modes = reasoning_modes or []

        for attempt in range(max_retries):
            logger.info(f"--- Tentative {attempt + 1}/{max_retries} ---")

            # 1. Exécution
            current_response = await self.execute_with_plan(
                task=task,
                plan=current_plan,
                worker_llm=worker_llm,
                previous_feedback=feedback,
            )

            # 2. Appel du Critic H2 (PHASE 6)
            logger.info("Phase 6: Évaluation critique H2")
            await self._emit_progress("Critic", "active", "Evaluating results (H2 Critic)...", root_llm.model_name if root_llm else self.root_llm.model_name)
            
            evaluation = await self.critic_agent.evaluate(
                task, current_plan.to_dict(), current_response
            )
            logger.info(f"Score Critique: {evaluation.score}")

            if evaluation.score >= 0.8:
                await self._emit_progress("Critic", "completed", f"Validation successful (Score: {evaluation.score})", root_llm.model_name if root_llm else self.root_llm.model_name)
                
                # VALIDATION -> SYNTHÈSE (PHASE 7)
                final_output = await self.synthesize_output(
                    task,
                    current_response,
                    root_llm=root_llm,
                    audit_llm=audit_llm,
                    analysis=analysis,
                    audit_timeout=audit_timeout,
                    audit_max_retries=audit_max_retries,
                    plan_complexity=current_plan.complexity,
                    plan_steps_count=len(current_plan.steps),
                )
                return {
                    "task": task,
                    "plan": current_plan.to_dict(),
                    "final_output": final_output,
                    "critic_score": evaluation.score,
                    "attempts": attempt + 1,
                    "reasoning_modes": modes,
                }
            else:
                logger.warning(f"Rejeté par H2: {evaluation.reason}")
                await self._emit_progress("Critic", "active", f"Validation failed ({evaluation.score}). Retrying...", root_llm.model_name if root_llm else self.root_llm.model_name)
                feedback = evaluation.feedback

                # DOUBLE-BACKTRACK LOGIC:
                # Si le feedback suggère un manque dans le PLAN, on replanifie
                if any(
                    kw in evaluation.reason.lower()
                    for kw in ["plan", "étape", "manquante", "structure"]
                ):
                    logger.info(
                        "Re-planification demandée par le Critique (Backtrack Phase 3)"
                    )
                    await self._emit_progress("Structuring", "active", "Backtracking to plan structure...", root_llm.model_name if root_llm else self.root_llm.model_name)

                    if attempt < max_retries - 1:
                        # Appel effectif à la restructuration du plan
                        new_plan = await self.restructure_plan(
                            current_plan, task, feedback, root_llm
                        )

                        # Si le nouveau plan est différent et valide, on le met à jour
                        if new_plan and new_plan.steps:
                            current_plan = new_plan
                            logger.info(
                                f"Plan mis à jour (Tentative {attempt + 1}). Nouvelle exécution avec le nouveau plan."
                            )
                            # La boucle continue avec 'current_plan' mis à jour
                            continue

        # Final pass Synthesis even if low score
        await self._emit_progress("Critic", "completed", "Max retries reached", root_llm.model_name if root_llm else self.root_llm.model_name)
        
        final_output = await self.synthesize_output(
            task,
            current_response,
            root_llm=root_llm,
            audit_llm=audit_llm,
            analysis=analysis,
            audit_timeout=audit_timeout,
            audit_max_retries=audit_max_retries,
            plan_complexity=current_plan.complexity,
            plan_steps_count=len(current_plan.steps),
        )
        await self._emit_progress("Final", "completed", "Task processing finished", self.root_llm.model_name)
        
        return {
            "task": task,
            "plan": current_plan.to_dict(),
            "final_output": final_output + f"\n\n[NOTE: Score H2: {evaluation.score}]",
            "critic_score": evaluation.score,
            "failed_validation": True,
            "reasoning_modes": modes,
        }

    async def run_full_cycle(
        self,
        task: str,
        root_llm: Optional[BaseLLM] = None,
        worker_llm: Optional[BaseLLM] = None,
        audit_llm: Optional[BaseLLM] = None,
        audit_timeout: int = 30,
        audit_max_retries: int = 3,
    ) -> Dict[str, Any]:
        """Orchestre tout le cycle Self-Discover optimisé (8 phases)."""
        logger.info(f"Démarrage cycle 8-phases pour: {task[:50]}...")
        await self._emit_progress("Task Input", "active", "Initializing cycle...")

        # 0. Analyze
        analysis = await self.analyze_task(task, root_llm=root_llm)

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

        # 4. Verify Plan
        verification = await self.verify_plan(plan, task, root_llm=root_llm)
        if not verification.get("is_valid", True):
            logger.warning(f"Plan initial invalide: {verification.get('feedback')}")
            # Re-planning shortcut could be here

        self.structured_plan = plan

        # 5, 6, 7. Execute, Critic, Synthesis
        result = await self.execute_with_critic(
            task,
            plan,
            worker_llm=worker_llm,
            root_llm=root_llm,
            audit_llm=audit_llm,
            analysis=analysis,
            audit_timeout=audit_timeout,
            audit_max_retries=audit_max_retries,
            reasoning_modes=[m.name for m in selected]
        )

        logger.info("Cycle 8-phases terminé")
        await self._emit_progress("Final", "completed", "Process completed successfully")
        return result
