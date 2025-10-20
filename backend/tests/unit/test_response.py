import json
from api.response import success_response, error_response


class TestResponseHelpers:
    def test_success_response_default(self):
        response = success_response(data={"test": "data"})
        
        assert response.status_code == 200
        body = json.loads(response.body)
        assert body["success"] is True
        assert body["message"] == "Success"
        assert body["data"] == {"test": "data"}
    
    def test_success_response_custom(self):
        response = success_response(
            data={"test": "data"},
            message="Custom message",
            status_code=201
        )
        
        assert response.status_code == 201
        body = json.loads(response.body)
        assert body["success"] is True
        assert body["message"] == "Custom message"
    
    def test_error_response_default(self):
        response = error_response(message="Error occurred")
        
        assert response.status_code == 400
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["message"] == "Error occurred"
    
    def test_error_response_with_errors(self):
        response = error_response(
            message="Validation failed",
            status_code=422,
            errors=["Field required"],
            error_codes=["missing"]
        )
        
        assert response.status_code == 422
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["errors"] == ["Field required"]
        assert body["error_codes"] == ["missing"]
    
    def test_error_response_with_data(self):
        response = error_response(
            message="Service unavailable",
            status_code=503,
            data={"status": "unhealthy", "database": "disconnected"}
        )
        
        assert response.status_code == 503
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["message"] == "Service unavailable"
        assert body["data"]["status"] == "unhealthy"
        assert body["data"]["database"] == "disconnected"

