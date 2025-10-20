class TestCreateVisit:
    def test_create_visit_success(self, client, sample_visit_data):
        response = client.post("/api/v1/visits", json=sample_visit_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Visit created successfully"
        assert data["data"]["url"] == sample_visit_data["url"]
        assert data["data"]["id"] is not None
    
    def test_create_visit_invalid_url(self, client):
        invalid_data = {
            "url": "not-a-valid-url",
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        response = client.post("/api/v1/visits", json=invalid_data)
        
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert "Validation error" in data["message"]
    
    def test_create_visit_missing_required_fields(self, client):
        invalid_data = {
            "title": "Test"
        }
        response = client.post("/api/v1/visits", json=invalid_data)
        
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
    
    def test_create_visit_negative_counts(self, client):
        invalid_data = {
            "url": "https://example.com",
            "link_count": -5,
            "word_count": 500,
            "image_count": 5
        }
        response = client.post("/api/v1/visits", json=invalid_data)
        
        assert response.status_code == 422


class TestBatchCreateVisits:
    def test_batch_create_success(self, client, sample_visits_batch):
        response = client.post("/api/v1/visits/batch", json=sample_visits_batch)
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["created_count"] == 2
    
    def test_batch_create_empty_list(self, client):
        response = client.post("/api/v1/visits/batch", json=[])
        
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["created_count"] == 0
    
    def test_batch_create_single_item(self, client, sample_visit_data):
        response = client.post("/api/v1/visits/batch", json=[sample_visit_data])
        
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["created_count"] == 1


class TestGetVisitHistory:
    def test_get_history_success(self, client, sample_visit_data):
        client.post("/api/v1/visits", json=sample_visit_data)
        client.post("/api/v1/visits", json=sample_visit_data)
        
        response = client.get(f"/api/v1/visits/history?url={sample_visit_data['url']}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 2
        assert len(data["data"]["items"]) == 2
        assert data["data"]["page"] == 1
        assert data["data"]["page_size"] == 10
    
    def test_get_history_pagination(self, client, sample_visit_data):
        for _ in range(15):
            client.post("/api/v1/visits", json=sample_visit_data)
        
        response_page1 = client.get(
            f"/api/v1/visits/history?url={sample_visit_data['url']}&page=1&page_size=10"
        )
        response_page2 = client.get(
            f"/api/v1/visits/history?url={sample_visit_data['url']}&page=2&page_size=10"
        )
        
        assert response_page1.status_code == 200
        assert response_page2.status_code == 200
        
        data_page1 = response_page1.json()
        data_page2 = response_page2.json()
        
        assert data_page1["data"]["total"] == 15
        assert data_page1["data"]["has_more"] is True
        assert len(data_page1["data"]["items"]) == 10
        assert len(data_page2["data"]["items"]) == 5
        assert data_page2["data"]["has_more"] is False
    
    def test_get_history_missing_url(self, client):
        response = client.get("/api/v1/visits/history")
        
        assert response.status_code == 422
    
    def test_get_history_empty_results(self, client):
        response = client.get("/api/v1/visits/history?url=https://nonexistent.com")
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["total"] == 0
        assert len(data["data"]["items"]) == 0


class TestGetPageMetrics:
    def test_get_metrics_success(self, client, sample_visit_data):
        client.post("/api/v1/visits", json=sample_visit_data)
        client.post("/api/v1/visits", json=sample_visit_data)
        client.post("/api/v1/visits", json=sample_visit_data)
        
        response = client.get(f"/api/v1/visits/metrics?url={sample_visit_data['url']}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total_visits"] == 3
    
    def test_get_metrics_no_visits(self, client):
        response = client.get("/api/v1/visits/metrics?url=https://nonexistent.com")
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["total_visits"] == 0
    
    def test_get_metrics_missing_url(self, client):
        response = client.get("/api/v1/visits/metrics")
        
        assert response.status_code == 422


class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        response = client.get("/")
        
        assert "strict-transport-security" in response.headers
        assert "x-frame-options" in response.headers
        assert "x-content-type-options" in response.headers
        assert "referrer-policy" in response.headers
        assert "x-xss-protection" in response.headers

