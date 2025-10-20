class TestHealthEndpoints:
    def test_root_endpoint(self, client):
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "History Sidepanel API" in data["data"]["message"]
    
    def test_health_check_healthy(self, client):
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"
        assert data["data"]["version"] == "1.0.0"
        assert "uptime_seconds" in data["data"]
        assert data["data"]["database"] == "connected"
    
    def test_health_check_response_structure(self, client):
        response = client.get("/health")
        data = response.json()
        
        assert "success" in data
        assert "message" in data
        assert "data" in data
        
        health_data = data["data"]
        assert "status" in health_data
        assert "version" in health_data
        assert "uptime_seconds" in health_data
        assert "database" in health_data

