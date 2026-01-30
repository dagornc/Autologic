
import pytest
from fastapi.testclient import TestClient
from autologic.main import app
from autologic.routers.prompts import PROMPTS_FILE
import json
import os

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown():
    # Setup: Backup existing file if any
    backup = None
    if PROMPTS_FILE.exists():
        backup = PROMPTS_FILE.read_text(encoding="utf-8")
    
    # Create empty/default for test
    PROMPTS_FILE.write_text("[]", encoding="utf-8")
    
    yield
    
    # Teardown: Restore backup
    if backup:
        PROMPTS_FILE.write_text(backup, encoding="utf-8")
    elif PROMPTS_FILE.exists():
        PROMPTS_FILE.unlink()

def test_list_prompts_empty():
    response = client.get("/prompts/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_prompt():
    prompt_data = {
        "title": "Test Prompt",
        "content": "This is a test prompt content.",
        "tags": ["test", "unit"]
    }
    response = client.post("/prompts/", json=prompt_data)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == prompt_data["title"]
    assert data["content"] == prompt_data["content"]
    assert "id" in data
    assert "created_at" in data

def test_update_prompt():
    # Create first
    p_data = {"title": "Original", "content": "Content", "tags": []}
    create_res = client.post("/prompts/", json=p_data)
    p_id = create_res.json()["id"]
    
    # Update
    update_data = {"title": "Updated", "content": "New Content"}
    response = client.put(f"/prompts/{p_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["content"] == "New Content"
    
def test_delete_prompt():
    # Create first
    p_data = {"title": "To Delete", "content": "Content", "tags": []}
    create_res = client.post("/prompts/", json=p_data)
    p_id = create_res.json()["id"]
    
    # Delete
    response = client.delete(f"/prompts/{p_id}")
    assert response.status_code == 204
    
    # Verify gone
    get_res = client.get("/prompts/")
    ids = [p["id"] for p in get_res.json()]
    assert p_id not in ids
