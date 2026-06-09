const pool = require("../db/pool");

async function getDetectionById(detectionId) {
  const result = await pool.query("SELECT * FROM detections WHERE id = $1", [
    detectionId,
  ]);
  return result.rows[0] || null;
}

async function addWorkflowStep(client, incidentId, step, status, performedBy, notes) {
  await client.query(
    `INSERT INTO workflow_steps (incident_id, step, status, performed_by, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [incidentId, step, status, performedBy, notes || null]
  );
}

async function createIncident(data, userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let detection = null;
    if (data.detection_id) {
      detection = await getDetectionById(data.detection_id);
      if (!detection) {
        throw Object.assign(new Error("Detection not found"), { statusCode: 404 });
      }
    }

    const incidentType =
      data.incident_type || detection?.label || "unknown_hazard";
    const severity = data.severity || "medium";
    const confidence = data.confidence ?? detection?.confidence ?? null;
    const bbox = data.bbox ? JSON.stringify(data.bbox) : detection?.bbox || null;
    const imageUrl = data.image_url || detection?.image_url || null;

    const result = await client.query(
      `INSERT INTO incidents (
        detection_id, incident_type, severity, status, location,
        image_url, confidence, bbox, created_by
      ) VALUES ($1, $2, $3, 'detected', $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.detection_id || null,
        incidentType,
        severity,
        data.location || null,
        imageUrl,
        confidence,
        bbox,
        userId,
      ]
    );

    const incident = result.rows[0];
    await addWorkflowStep(
      client,
      incident.id,
      "detected",
      "completed",
      userId,
      "Incident created from detection"
    );

    await client.query("COMMIT");
    return incident;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getWorkflowSteps(incidentId) {
  const result = await pool.query(
    `SELECT ws.*, u.username AS performed_by_username
     FROM workflow_steps ws
     LEFT JOIN users u ON u.id = ws.performed_by
     WHERE ws.incident_id = $1
     ORDER BY ws.created_at ASC`,
    [incidentId]
  );
  return result.rows;
}

async function getIncidentById(id) {
  const result = await pool.query(
    `SELECT i.*,
            d.label AS detection_label,
            cu.username AS created_by_username,
            au.username AS assigned_to_username
     FROM incidents i
     LEFT JOIN detections d ON d.id = i.detection_id
     LEFT JOIN users cu ON cu.id = i.created_by
     LEFT JOIN users au ON au.id = i.assigned_to
     WHERE i.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const incident = result.rows[0];
  incident.workflow_steps = await getWorkflowSteps(id);
  return incident;
}

async function listIncidents() {
  const result = await pool.query(
    `SELECT i.*, d.label AS detection_label
     FROM incidents i
     LEFT JOIN detections d ON d.id = i.detection_id
     ORDER BY i.created_at DESC`
  );
  return result.rows;
}

async function updateIncidentStatus(id, status, userId, notes) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT * FROM incidents WHERE id = $1", [
      id,
    ]);

    if (existing.rows.length === 0) {
      throw Object.assign(new Error("Incident not found"), { statusCode: 404 });
    }

    const result = await client.query(
      `UPDATE incidents
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    await addWorkflowStep(client, id, status, "completed", userId, notes);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createIncident,
  getIncidentById,
  listIncidents,
  updateIncidentStatus,
  addWorkflowStep,
};
