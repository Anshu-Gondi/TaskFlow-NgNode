# test_api.py

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_schedule_api():
    response = client.post("/api/schedule", json={
        "tasks": [
            {
                "title": "Test A",
                "_listId": "1",
                "priority": 2,
                "dueDate": "2025-07-01",
                "completed": False
            },
            {
                "title": "Test B",
                "_listId": "1",
                "priority": 3,
                "dueDate": "2025-01-01",
                "completed": False
            }
        ]
    })

    assert response.status_code == 200
    data = response.json()
    assert "scheduled" in data
    assert data["scheduled"][0]["title"] == "Test B"
