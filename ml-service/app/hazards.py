# Mapping YOLO detected objects to workplace hazards

HAZARD_MAP = {

    # fire hazards
    "fire": "fire",
    "smoke": "fire",

    # spill risks
    "bottle": "spill",
    "cup": "spill",
    "wine glass": "spill",

    # equipment hazards
    "truck": "equipment_fault",
    "car": "equipment_fault",
    "forklift": "equipment_fault",

    # people related risks
    "person": "worker_present"
}

def classify_hazards(detections):

    hazards = []

    for det in detections:

        label = det["label"]

        if label in HAZARD_MAP:

            hazards.append({
                "type": HAZARD_MAP[label],
                "confidence": det["confidence"],
                "bbox": det["bbox"]
            })

    return hazards