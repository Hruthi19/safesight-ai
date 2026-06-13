const express = require("express");
const incidentService = require("../services/incidentService");
const { enqueueIncidentJobs } = require("../jobs/queue");
const { emitIncident } = require("../socket");

const router = express.Router();

const INCIDENT_TYPE_MAP = {
  fire: "fire_detected",
  spill: "spill_detected",
  equipment_fault: "equipment_hazard",
  worker_present: "worker_in_area",
};

const SEVERITY_MAP = {
  fire: "high",
  spill: "medium",
  equipment_fault: "high",
  worker_present: "low",
};

router.post("/ml-alert", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (
    process.env.ML_WEBHOOK_KEY &&
    apiKey !== process.env.ML_WEBHOOK_KEY
  ) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const { incidents, detection_id, image_url, clip_url, stored_ids } =
      req.body;

    if (!incidents || incidents.length === 0) {
      return res.json({ success: true, data: { created: [] } });
    }

    const created = [];

    for (const inc of incidents) {
      const hazardType = inc.incident_type?.replace("_detected", "") || "unknown";
      const mappedType =
        inc.incident_type ||
        INCIDENT_TYPE_MAP[hazardType] ||
        `${hazardType}_detected`;

      const incident = await incidentService.createIncidentFromML({
        detection_id: detection_id || stored_ids?.[0] || null,
        incident_type: mappedType,
        severity: inc.severity || SEVERITY_MAP[hazardType] || "medium",
        confidence: inc.confidence,
        bbox: inc.bbox,
        image_url: inc.image_url || image_url,
        clip_url: inc.clip_url || clip_url,
        location: "Live detection",
      });

      await enqueueIncidentJobs(incident);
      emitIncident("incident:new", incident);
      created.push(incident);
    }

    res.status(201).json({ success: true, data: { created } });
  } catch (err) {
    console.error("ML webhook error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
