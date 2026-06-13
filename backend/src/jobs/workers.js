const { Worker } = require("bullmq");
const pool = require("../db/pool");
const { connection } = require("./queue");
const { notifyIncident, notifyEscalation } = require("../services/notifications");
const { emitIncident } = require("../socket");

function startWorkers() {
  const notificationWorker = new Worker(
    "incident-notifications",
    async (job) => {
      const { incidentId, incidentType, severity } = job.data;
      console.log(
        `[NOTIFY] Incident #${incidentId}: ${incidentType} (${severity})`
      );

      await pool.query(
        `UPDATE incidents SET status = 'notified', updated_at = NOW()
         WHERE id = $1 AND status = 'detected'`,
        [incidentId]
      );

      await pool.query(
        `INSERT INTO workflow_steps (incident_id, step, status, notes)
         VALUES ($1, 'notified', 'completed', $2)`,
        [
          incidentId,
          `Auto-notification sent for ${incidentType} (${severity})`,
        ]
      );

      const result = await pool.query(
        "SELECT * FROM incidents WHERE id = $1",
        [incidentId]
      );
      const incident = result.rows[0];

      if (incident) {
        emitIncident("incident:updated", incident);
      }

      await notifyIncident({
        incidentId,
        incidentType,
        severity,
        status: "notified",
      });

      return { notified: true };
    },
    { connection }
  );

  const escalationWorker = new Worker(
    "incident-escalations",
    async (job) => {
      const { incidentId, severity } = job.data;

      const result = await pool.query(
        "SELECT * FROM incidents WHERE id = $1",
        [incidentId]
      );

      if (result.rows.length === 0) {
        return { escalated: false, reason: "incident not found" };
      }

      const incident = result.rows[0];
      if (incident.status === "resolved" || incident.status === "closed") {
        return { escalated: false, reason: "already closed" };
      }

      if (incident.status !== "escalated") {
        await pool.query(
          `UPDATE incidents SET status = 'escalated', updated_at = NOW()
           WHERE id = $1`,
          [incidentId]
        );

        await pool.query(
          `INSERT INTO workflow_steps (incident_id, step, status, notes)
           VALUES ($1, 'escalated', 'completed', $2)`,
          [
            incidentId,
            `Auto-escalation triggered for unresolved ${severity} incident`,
          ]
        );

        const updated = await pool.query(
          "SELECT * FROM incidents WHERE id = $1",
          [incidentId]
        );

        emitIncident("incident:escalated", updated.rows[0]);
        await notifyEscalation({ incidentId, severity });

        console.log(`[ESCALATE] Incident #${incidentId} escalated`);
        return { escalated: true };
      }

      return { escalated: false, reason: "already escalated" };
    },
    { connection }
  );

  notificationWorker.on("failed", (_job, err) => {
    console.error("[NOTIFY] Job failed:", err.message);
  });

  escalationWorker.on("failed", (_job, err) => {
    console.error("[ESCALATE] Job failed:", err.message);
  });

  console.log("Background workers started");
  return { notificationWorker, escalationWorker };
}

module.exports = { startWorkers };
