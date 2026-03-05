from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200


def test_detect():
    res = client.post("/detect", json={"camera_id": "cam1", "image_url": "test.jpg"})

    assert res.status_code == 200
