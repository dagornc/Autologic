# autologic/core/models.py
"""
Modèles de données pour le système de raisonnement AutoLogic.
Contient les entités ReasoningModule, AdaptedModule et ReasoningPlan.
"""

from typing import List, Dict, Any
from dataclasses import dataclass, field


@dataclass
class ReasoningModule:
    """Représente un module de raisonnement cognitif de la bibliothèque des modules."""

    id: str
    name: str
    description: str
    category: str

    def to_dict(self) -> Dict[str, Any]:
        """Convertit le module en dictionnaire pour sérialisation JSON."""
        return {"id": self.id, "name": self.name, "description": self.description, "category": self.category}


@dataclass
class AdaptedModule:
    """Module adapté à une tâche spécifique après la phase d'adaptation."""

    base: ReasoningModule
    adapted_description: str
    specific_actions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convertit le module adapté en dictionnaire."""
        return {
            "id": self.base.id,
            "original_name": self.base.name,
            "adapted_description": self.adapted_description,
            "specific_actions": self.specific_actions,
        }


@dataclass
class ReasoningPlanStep:
    """Une étape individuelle du plan de raisonnement."""

    step_number: int
    module_id: str
    module_name: str
    action: str
    expected_output: str

    def to_dict(self) -> Dict[str, Any]:
        """Convertit l'étape en dictionnaire."""
        return {
            "step_number": self.step_number,
            "module_id": self.module_id,
            "module_name": self.module_name,
            "action": self.action,
            "expected_output": self.expected_output,
        }


@dataclass
class ReasoningPlan:
    """Plan de raisonnement structuré contenant les étapes ordonnées."""

    steps: List[ReasoningPlanStep] = field(default_factory=list)
    complexity: str = "medium"

    def to_dict(self) -> Dict[str, Any]:
        """Convertit le plan en dictionnaire."""
        return {
            "steps": [s.to_dict() for s in self.steps],
            "estimated_complexity": self.complexity,
            "total_steps": len(self.steps),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ReasoningPlan":
        """Crée un ReasoningPlan depuis un dictionnaire."""
        steps = [
            ReasoningPlanStep(
                step_number=s.get("step_number", i + 1),
                module_id=s.get("module_id", ""),
                module_name=s.get("module_name", ""),
                action=s.get("action", ""),
                expected_output=s.get("expected_output", ""),
            )
            for i, s in enumerate(data.get("steps") or [])
        ]
        return cls(steps=steps, complexity=data.get("estimated_complexity", "medium"))
