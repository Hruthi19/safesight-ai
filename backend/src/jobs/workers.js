const { Worker } = require("bullmq");
const pool = require("../db/pool");
const { connection } = require("./queue");

function startWorkers() {
  const notificationWorker = new Worker(
    "incident-notifications",
    async (job) => {
      const { incidentId, incidentType, severity } = job.data;
      console.log(
        `[NOTIFY] Incident #${incidentId}: ${incidentType} (${severity}) — alerting managers`
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

      return { notified: true };
    },
    { connection }
  );

  const escalationWorker = new Worker(
    "incident-escalations",
    async (job) => {
      const { incidentId, severity } = job.data;

      const result = await pool.query(
        "SELECT status FROM incidents WHERE id = $1",
        [incidentId]
      );

      if (result.rows.length === 0) {
        return { escalated: false, reason: "incident not found" };
      }

      const status = result.rows[0].status;
      if (status === "resolved" || status === "closed") {
        return { escalated: false, reason: "already closed" };
      }

      if (status !== "escalated") {
        await pool.query(
          `UPDATE incidents SET status = 'escalated', updated_at = NOW() WHERE id = $1`,
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

        console.log(`[ESCALATE] Incident #${incidentId} escalated`);
        return { escalated: true };
      }

      return { escalated: false, reason: "already escalated" };
    },
    { connection }
  );

  notificationWorker.on("failed", (job, err) => {
    console.error("[NOTIFY] Job failed:", err.message);
  });

  escalationWorker.on("failed", (job, err) => {
    console.error("[ESCALATE] Job failed:", err.message);
  });

  console.log("Background workers started");
  return { notificationWorker, escalationWorker };
}

module.exports = { startWorkers };
