from datetime import datetime


def detect_incidents(hazards):

    incidents = []

    for hazard in hazards:

        hazard_type = hazard["type"]

        if hazard_type == "spill":
            severity = "medium"
            incident_type = "spill_detected"

        elif hazard_type == "fire":
            severity = "high"
            incident_type = "fire_detected"

        elif hazard_type == "equipment_fault":
            severity = "high"
            incident_type = "equipment_hazard"

        elif hazard_type == "worker_present":
            severity = "low"
            incident_type = "worker_in_area"

        else:
            continue

        incidents.append(
            {
                "incident_type": incident_type,
                "severity": severity,
                "timestamp": datetime.utcnow().isoformat(),
                "bbox": hazard["bbox"],
                "confidence": hazard["confidence"],
            }
        )

    return incidents
