from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class DetectRequest(BaseModel):
    image_url: Optional[str] = None

@app.get("/")
def root():
    return {"status":"ml-service ok"}

@app.post("/detect")
def detect(req: DetectRequest):
    # Dummy detection response (replace with real model later)
    return {"detections": [{"label":"spill","confidence":0.85,"bbox":[100,120,200,240]}]}

