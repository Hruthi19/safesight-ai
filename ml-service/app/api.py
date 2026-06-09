import os
import tempfile
import uuid

import requests
from fastapi import FastAPI, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.alerts import broadcast, connect
from app.database import init_db, save_detections, save_incidents
from app.hazards import classify_hazards
from app.incidents import detect_incidents
from app.model import get_detector
from app.storage import ensure_bucket, upload_image

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


async def save_upload_file(upload: UploadFile):
    suffix = os.path.splitext(upload.filename or "image.jpg")[1] or ".jpg"
    filename = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}{suffix}")
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

    if incidents:
        save_incidents(incidents)

    return {
        "detections": detections,
        "image_url": image_url,
        "stored_ids": stored_ids,
        "hazards": hazards,
        "incidents": incidents,
    }


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
                detail="Provide a JSON body with image_url or upload a file",
            )

        result = run_detection(image_path)

        if result["incidents"]:
            await broadcast({"type": "incident_alert", "incidents": result["incidents"]})

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


@app.websocket("/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("Client disconnected")
