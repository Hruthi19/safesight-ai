const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requirePermission, canUpdateStatus, VALID_STATUSES } = require("../middleware/rbac");
const incidentService = require("../services/incidentService");
const { enqueueIncidentJobs } = require("../jobs/queue");

const router = express.Router();

router.use(authenticate);

router.get("/", requirePermission("incidents:read"), async (req, res) => {
  try {
    const incidents = await incidentService.listIncidents();
    res.json({ success: true, data: incidents });
  } catch (err) {
    console.error("List incidents error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch incidents" });
  }
});

router.post("/", requirePermission("incidents:create"), async (req, res) => {
  try {
    const incident = await incidentService.createIncident(req.body, req.user.id);
    await enqueueIncidentJobs(incident);

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    console.error("Create incident error:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Failed to create incident",
    });
  }
});

router.get("/:id", requirePermission("incidents:read"), async (req, res) => {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, error: "Incident not found" });
    }

    res.json({ success: true, data: incident });
  } catch (err) {
    console.error("Get incident error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch incident" });
  }
});

router.patch("/:id/status", async (req, res) => {
  const { status, notes } = req.body;

  if (!status || !VALID_STATUSES.has(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Allowed: ${[...VALID_STATUSES].join(", ")}`,
    });
  }

  const isWorkerProgress =
    req.user.role === "worker" && status === "in_progress";
  const isManagerUpdate =
    req.user.role === "manager" || req.user.role === "admin";

  if (!isWorkerProgress && !isManagerUpdate) {
    return res.status(403).json({
      success: false,
      error: "Insufficient permissions to update incident status",
    });
  }

  if (!canUpdateStatus(req.user.role, status)) {
    return res.status(403).json({
      success: false,
      error: `Role '${req.user.role}' cannot set status to '${status}'`,
    });
  }

  try {
    const incident = await incidentService.updateIncidentStatus(
      req.params.id,
      status,
      req.user.id,
      notes
    );

    res.json({ success: true, data: incident });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Failed to update incident status",
    });
  }
});

module.exports = router;
