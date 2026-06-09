from unittest.mock import patch

from fastapi.testclient import TestClient

from app.api import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("app.api.run_detection")
@patch("app.api.download_image")
def test_detect_json(mock_download, mock_run_detection):
    mock_download.return_value = "/tmp/test.jpg"
    mock_run_detection.return_value = {
        "detections": [
            {"label": "person", "confidence": 0.91, "bbox": [10, 20, 100, 200]}
        ],
        "image_url": "http://localhost:9000/safesight-ai/test.jpg",
        "stored_ids": [1],
        "hazards": [],
        "incidents": [],
    }

    response = client.post(
        "/detect",
        json={"image_url": "https://example.com/worker.jpg"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["detections"]) == 1
    assert data["detections"][0]["label"] == "person"
    assert data["stored_ids"] == [1]
    assert "image_url" in data


@patch("app.api.save_upload_file")
@patch("app.api.run_detection")
def test_detect_file_upload(mock_run_detection, mock_save_upload):
    mock_save_upload.return_value = "/tmp/test.jpg"
    mock_run_detection.return_value = {
        "detections": [],
        "image_url": "http://localhost:9000/safesight-ai/test.jpg",
        "stored_ids": [],
        "hazards": [],
        "incidents": [],
    }

    response = client.post(
        "/detect",
        files={"file": ("sample.jpg", b"fake-image-bytes", "image/jpeg")},
    )

    assert response.status_code == 200
    assert "detections" in response.json()
