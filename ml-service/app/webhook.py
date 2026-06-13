import os
import uuid

import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:5000")
ML_WEBHOOK_KEY = os.getenv("ML_WEBHOOK_KEY", "safesight-ml-key")


def notify_backend(payload):
    """Push ML detections to backend for workflow + real-time alerts."""
    try:
        headers = {"Content-Type": "application/json"}
        if ML_WEBHOOK_KEY:
            headers["X-API-Key"] = ML_WEBHOOK_KEY

        response = requests.post(
            f"{BACKEND_URL}/webhooks/ml-alert",
            json=payload,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[WEBHOOK] Backend notification failed: {e}")
        return None
