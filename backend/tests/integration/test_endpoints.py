"""
Integration tests for API endpoints
"""
import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Test cases for health check endpoint"""

    @pytest.mark.integration
    def test_health_endpoint(self, client):
        """Test health endpoint returns success"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        assert "api_version" in data

    @pytest.mark.integration
    def test_cors_test_endpoint(self, client):
        """Test CORS test endpoint"""
        response = client.get("/cors-test")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["message"] == "CORS is working!"
        assert "allowed_origins" in data


class TestRootEndpoint:
    """Test cases for root endpoint"""

    @pytest.mark.integration
    def test_root_endpoint(self, client):
        """Test root endpoint returns basic info"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "message" in data


class TestMetricsEndpoint:
    """Test cases for metrics endpoint"""

    @pytest.mark.integration
    def test_metrics_endpoint(self, client):
        """Test metrics endpoint returns performance data"""
        response = client.get("/metrics")

        assert response.status_code == 200
        data = response.json()
        assert "database" in data
        assert "auth_cache" in data
        assert "system" in data