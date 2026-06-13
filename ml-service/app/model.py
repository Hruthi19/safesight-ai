import os

from ultralytics import YOLO

from app.fire_detector import detect_fire_smoke


class HazardDetector:
    def __init__(self):
        self.model = YOLO(os.getenv("YOLO_MODEL_PATH", "yolov8n.pt"))

    def detect(self, image_path):
        results = self.model(image_path)
        detections = []

        for r in results:
            for box in r.boxes:
                detections.append(
                    {
                        "label": r.names[int(box.cls)],
                        "confidence": float(box.conf),
                        "bbox": box.xyxy.tolist()[0],
                    }
                )

        fire_detections = detect_fire_smoke(image_path)
        return detections + fire_detections


_detector = None


def get_detector():
    global _detector
    if _detector is None:
        _detector = HazardDetector()
    return _detector
