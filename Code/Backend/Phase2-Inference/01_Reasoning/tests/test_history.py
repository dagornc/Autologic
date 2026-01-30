
from fastapi.testclient import TestClient
from autologic.main import app, PROJECT_ROOT
import shutil
from pathlib import Path
import json

client = TestClient(app)

# Setup temp history dir for testing
HISTORY_DIR = Path(__file__).parent.parent / "history"

def test_history_crud():
    # 1. Create
    payload = {
        "task": "Test Task",
        "plan": {"steps": []},
        "final_output": "Test Output"
    }
    response = client.post("/history/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["task"] == "Test Task"
    item_id = data["id"]
    
    # 2. List
    response = client.get("/history/")
    assert response.status_code == 200
    history_list = response.json()
    assert len(history_list) >= 1
    assert any(item["id"] == item_id for item in history_list)
    
    # 3. Get generic
    response = client.get(f"/history/{item_id}")
    assert response.status_code == 200
    assert response.json()["id"] == item_id
    
    # 4. Delete
    response = client.delete(f"/history/{item_id}")
    assert response.status_code == 200
    
    # 5. Verify Delete
    response = client.get(f"/history/{item_id}")
    assert response.status_code == 404
