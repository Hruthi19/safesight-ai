from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()


class Frame(BaseModel):
    camera_id: str
    image_url: str


@app.get("/health")
def health():
    return {"status": "ml service running"}


@app.post("/detect")
def detect(frame: Frame):
    """
    Placeholder ML detection
    Later this will call YOLO or HuggingFace model
    """

    hazards = ["spill", "fall", "equipment_fault", None]

    result = random.choice(hazards)

    if result:
        return {"hazard": result, "confidence": round(random.uniform(0.7, 0.95), 2)}

    return {"hazard": None}
