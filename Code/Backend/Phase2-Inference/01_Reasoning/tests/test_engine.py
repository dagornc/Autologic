# Code/Backend/Phase2-Inference/01_Reasoning/tests/test_engine.py
"""
Tests unitaires pour le moteur AutoLogic.
"""

import pytest
from autologic.core.engine import AutoLogicEngine, BaseLLM
from autologic.core.models import ReasoningModule, AdaptedModule, ReasoningPlan, ReasoningPlanStep


class MockLLM(BaseLLM):
    """LLM mocké pour les tests."""

    @property
    def model_name(self) -> str:
        return "mock-model"

    @property
    def provider_name(self) -> str:
        return "mock-provider"
    
    async def call(self, prompt: str, **kwargs) -> str:
        """Retourne des réponses mockées selon le contenu du prompt."""
        if "BIBLIOTHÈQUE DE MODULES" in prompt:
            return '{"selected_modules": ["decomposer_le_probleme", "brainstorming"]}'
        if "MODULES SÉLECTIONNÉS" in prompt:
            return '{"adapted_modules": [{"id": "decomposer_le_probleme", "adapted_description": "desc", "specific_actions": ["act1"]}, {"id": "brainstorming", "adapted_description": "desc", "specific_actions": ["act2"]}]}'
        if "MODULES ADAPTÉS" in prompt:
            return '{"reasoning_plan": {"steps": [{"step_number": 1, "module_id": "decomposer_le_probleme", "module_name": "Decomposer", "action": "think", "expected_output": "thought"}], "estimated_complexity": "low"}}'
        return "Executed"


@pytest.fixture
def engine() -> AutoLogicEngine:
    """Fixture pour créer un engine avec LLM mocké."""
    return AutoLogicEngine(root_model=MockLLM(), worker_model=MockLLM())


@pytest.fixture
def sample_module() -> ReasoningModule:
    """Fixture pour un module de test."""
    return ReasoningModule(
        id="test_module",
        name="Test Module",
        description="A test module",
        category="test"
    )


class TestReasoningModule:
    """Tests pour la classe ReasoningModule."""
    
    def test_to_dict(self, sample_module: ReasoningModule) -> None:
        """Test de la sérialisation en dict."""
        result = sample_module.to_dict()
        assert result["id"] == "test_module"
        assert result["name"] == "Test Module"
        assert result["category"] == "test"


class TestReasoningPlan:
    """Tests pour la classe ReasoningPlan."""
    
    def test_from_dict(self) -> None:
        """Test de la désérialisation depuis dict."""
        data = {
            "steps": [
                {
                    "step_number": 1,
                    "module_id": "mod1",
                    "module_name": "Module 1",
                    "action": "Do something",
                    "expected_output": "Result"
                }
            ],
            "estimated_complexity": "high"
        }
        plan = ReasoningPlan.from_dict(data)
        assert len(plan.steps) == 1
        assert plan.complexity == "high"
        assert plan.steps[0].module_id == "mod1"
    
    def test_to_dict(self) -> None:
        """Test de la sérialisation en dict."""
        step = ReasoningPlanStep(
            step_number=1,
            module_id="mod1",
            module_name="Module 1",
            action="Action",
            expected_output="Output"
        )
        plan = ReasoningPlan(steps=[step], complexity="low")
        result = plan.to_dict()
        assert result["total_steps"] == 1
        assert result["estimated_complexity"] == "low"


class TestAutoLogicEngine:
    """Tests pour le moteur AutoLogic."""
    
    @pytest.mark.asyncio
    async def test_module_loading(self, engine: AutoLogicEngine) -> None:
        """Test du chargement des modules."""
        assert len(engine.reasoning_modules) == 106
        assert engine.reasoning_modules[0].name == "Décomposer le problème"
    
    @pytest.mark.asyncio
    async def test_select_modules(self, engine: AutoLogicEngine) -> None:
        """Test de la phase de sélection."""
        selected = await engine.select_modules("Test task")
        assert len(selected) == 2
    
    @pytest.mark.asyncio
    async def test_full_cycle(self, engine: AutoLogicEngine) -> None:
        """Test du cycle complet."""
        task = "Solve X"
        result = await engine.run_full_cycle(task)
        
        assert "error" not in result
        assert result["task"] == task
        assert "Executed" in result["final_output"]
        assert "Executed" in result["final_output"]
        assert len(result["plan"]["steps"]) == 1


class TestAdaptedModule:
    """Tests pour la classe AdaptedModule."""
    
    def test_to_dict(self, sample_module: ReasoningModule) -> None:
        """Test de la sérialisation."""
        adapted = AdaptedModule(
            base=sample_module,
            adapted_description="Adapted description",
            specific_actions=["action1", "action2"]
        )
        result = adapted.to_dict()
        assert result["id"] == "test_module"
        assert result["original_name"] == "Test Module"
        assert len(result["specific_actions"]) == 2
