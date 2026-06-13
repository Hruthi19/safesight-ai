import os
import tempfile
import uuid

import cv2
import requests
from fastapi import (
    FastAPI,
    HTTPException,
    Request,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.alerts import broadcast, connect
from app.clips import extract_clip, get_video_duration
from app.database import init_db, save_detections
from app.hazards import classify_hazards
from app.incidents import detect_incidents
from app.model import get_detector
from app.storage import ensure_bucket, upload_image, upload_video
from app.webhook import notify_backend

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DetectRequest(BaseModel):
    image_url: str


@app.on_event("startup")
def startup():
    init_db()
    ensure_bucket()


@app.get("/")
def root():
    return {"status": "ml-service ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


def download_image(url):
    filename = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.jpg")
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    with open(filename, "wb") as f:
        f.write(response.content)
    return filename


async def save_upload_file(upload: UploadFile, suffix=".jpg"):
    ext = suffix if suffix.startswith(".") else f".{suffix}"
    filename = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}{ext}")
    content = await upload.read()
    with open(filename, "wb") as f:
        f.write(content)
    return filename


def run_detection(image_path):
    detections = get_detector().detect(image_path)
    image_url = upload_image(image_path)
    stored_ids = save_detections(detections, image_url)

    hazards = classify_hazards(detections)
    incidents = detect_incidents(hazards)
    for incident in incidents:
        incident["image_url"] = image_url

    return {
        "detections": detections,
        "image_url": image_url,
        "stored_ids": stored_ids,
        "hazards": hazards,
        "incidents": incidents,
    }


def run_video_detection(video_path, sample_interval=30):
    """Sample video frames and detect hazards; extract clip on first hit."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError("Could not open video file")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    frame_idx = 0
    all_detections = []
    incidents = []
    clip_url = None
    snapshot_url = None
    stored_ids = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_interval == 0:
            frame_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.jpg")
            cv2.imwrite(frame_path, frame)

            result = run_detection(frame_path)
            if result["incidents"] and not incidents:
                center_sec = frame_idx / fps
                try:
                    clip_path = extract_clip(video_path, center_sec)
                    clip_url = upload_video(clip_path)
                    for inc in result["incidents"]:
                        inc["clip_url"] = clip_url
                except Exception as e:
                    print(f"[CLIP] Extraction failed: {e}")

                incidents = result["incidents"]
                snapshot_url = result["image_url"]
                stored_ids = result["stored_ids"]
                all_detections = result["detections"]

        frame_idx += 1

    cap.release()

    return {
        "detections": all_detections,
        "incidents": incidents,
        "image_url": snapshot_url,
        "clip_url": clip_url,
        "stored_ids": stored_ids,
        "frames_processed": frame_idx,
        "duration_sec": get_video_duration(video_path),
    }


async def handle_detection_result(result):
    if result["incidents"]:
        await broadcast({"type": "incident_alert", "incidents": result["incidents"]})
        notify_backend(result)


@app.post("/detect")
async def detect(request: Request):
    try:
        content_type = request.headers.get("content-type", "")

        if "application/json" in content_type:
            body = await request.json()
            req = DetectRequest(**body)
            if not req.image_url:
                raise HTTPException(status_code=400, detail="image_url required")
            image_path = download_image(req.image_url)
        elif "multipart/form-data" in content_type:
            form = await request.form()
            upload = form.get("file")
            if upload is None:
                raise HTTPException(status_code=400, detail="file required")
            image_path = await save_upload_file(upload)
        else:
            raise HTTPException(
                status_code=400,
                detail="Provide JSON with image_url or upload a file",
            )

        result = run_detection(image_path)
        await handle_detection_result(result)

        return {
            "detections": result["detections"],
            "image_url": result["image_url"],
            "stored_ids": result["stored_ids"],
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect/video")
async def detect_video(request: Request):
    try:
        form = await request.form()
        upload = form.get("file")
        if upload is None:
            raise HTTPException(status_code=400, detail="video file required")

        video_path = await save_upload_file(
            upload, suffix=os.path.splitext(upload.filename or ".mp4")[1]
        )
        result = run_video_detection(video_path)
        await handle_detection_result(result)

        return {
            "detections": result["detections"],
            "incidents": result["incidents"],
            "image_url": result["image_url"],
            "clip_url": result["clip_url"],
            "stored_ids": result["stored_ids"],
            "frames_processed": result["frames_processed"],
            "duration_sec": result["duration_sec"],
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("Client disconnected")
