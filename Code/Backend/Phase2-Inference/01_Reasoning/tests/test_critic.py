import pytest
from unittest.mock import AsyncMock, MagicMock
from autologic.core.critic import CriticAgent, CriticEvaluation

# Mock pour l'interface LLM
class MockLLM:
    def __init__(self):
        self.call = AsyncMock()

@pytest.mark.asyncio
async def test_heuristic_rejection_antigravity():
    """Test que l'heuristique rejette les hallucinations sur l'API Antigravity."""
    mock_llm = MockLLM()
    agent = CriticAgent(mock_llm)
    
    task = "Comment voler avec l'api google antigravity ?"
    # Réponse contenant un terme interdit
    response = "Il suffit d'utiliser import google.physics.levitation pour annuler la gravité."
    
    evaluation = await agent.evaluate(task, {}, response)
    
    assert evaluation.status == "REJECT"
    assert evaluation.score == 0.1
    assert "heuristic" in evaluation.reason.lower() or "détection" in evaluation.reason.lower()
    
    # Le LLM ne doit pas être appelé si l'heuristique rejette
    mock_llm.call.assert_not_called()

@pytest.mark.asyncio
async def test_heuristic_rejection_short_response():
    """Test que l'heuristique rejette les réponses trop courtes."""
    mock_llm = MockLLM()
    agent = CriticAgent(mock_llm)
    
    task = "Explain quantum physics"
    response = "It is hard." # Trop court (< 50 chars)
    
    evaluation = await agent.evaluate(task, {}, response)
    
    assert evaluation.status == "REJECT"
    assert evaluation.score == 0.2
    mock_llm.call.assert_not_called()

@pytest.mark.asyncio
async def test_llm_validation_success():
    """Test d'une validation réussie par le LLM."""
    mock_llm = MockLLM()
    # Mock réponse JSON valide
    mock_llm.call.return_value = """
    ```json
    {
        "score": 0.95,
        "status": "VALID",
        "reason": "Excellent reasoning",
        "feedback": "None"
    }
    ```
    """
    agent = CriticAgent(mock_llm)
    
    task = "Explain gravity"
    response = "Gravity is a fundamental interaction which causes mutual attraction between all things with mass or energy." + ("x" * 50) # Assez long
    
    evaluation = await agent.evaluate(task, {}, response)
    
    assert evaluation.status == "VALID"
    assert evaluation.score == 0.95
    assert evaluation.reason == "Excellent reasoning"
    mock_llm.call.assert_called_once()

@pytest.mark.asyncio
async def test_llm_rejection():
    """Test d'un rejet par le LLM."""
    mock_llm = MockLLM()
    mock_llm.call.return_value = """
    {
        "score": 0.4,
        "status": "REJECT",
        "reason": "Missing steps",
        "feedback": "Add citation"
    }
    """
    agent = CriticAgent(mock_llm)
    
    evaluation = await agent.evaluate("task", {}, "response satisfying length requirement " * 5)
    
    assert evaluation.status == "REJECT"
    assert evaluation.score == 0.4
    assert evaluation.feedback == "Add citation"
