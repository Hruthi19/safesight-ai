const express = require("express");
const router = express.Router();

let incidents = [];

/**
 * GET /incidents
 * Return all incidents
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: incidents
  });
});

/**
 * POST /incidents
 * Create a new incident
 */
router.post("/", (req, res) => {
  const { type, location, imageUrl, confidence } = req.body;

  const incident = {
    id: Date.now(),
    type,
    location,
    imageUrl,
    confidence,
    createdAt: new Date()
  };

  incidents.push(incident);

  res.status(201).json({
    success: true,
    data: incident
  });
});

module.exports = router;