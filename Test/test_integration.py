# Test/test_integration.py
"""
Tests d'intégration pour AutoLogic.
Vérifie le bon fonctionnement de l'ensemble du système.
"""

import pytest
from httpx import AsyncClient


class TestAPIIntegration:
    """Tests d'intégration pour l'API FastAPI."""

    @pytest.mark.asyncio
    async def test_health_endpoint(self) -> None:
        """Test du endpoint de health check."""
        # Import local pour éviter les problèmes de path
        from autologic.main import app

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    @pytest.mark.asyncio
    async def test_root_endpoint(self) -> None:
        """Test du endpoint racine."""
        from autologic.main import app

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/")

        assert response.status_code == 200
        assert response.json()["status"] == "online"
