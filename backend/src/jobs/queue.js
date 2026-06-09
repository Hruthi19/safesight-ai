const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT || 6379),
};

let notificationQueue;
let escalationQueue;

function getNotificationQueue() {
  if (!notificationQueue) {
    notificationQueue = new Queue("incident-notifications", { connection });
  }
  return notificationQueue;
}

function getEscalationQueue() {
  if (!escalationQueue) {
    escalationQueue = new Queue("incident-escalations", { connection });
  }
  return escalationQueue;
}

async function enqueueIncidentJobs(incident) {
  await getNotificationQueue().add(
    "notify",
    {
      incidentId: incident.id,
      incidentType: incident.incident_type,
      severity: incident.severity,
    },
    { removeOnComplete: true }
  );

  await getEscalationQueue().add(
    "escalate",
    { incidentId: incident.id, severity: incident.severity },
    {
      delay: incident.severity === "high" ? 60_000 : 300_000,
      removeOnComplete: true,
    }
  );
}

module.exports = {
  getNotificationQueue,
  getEscalationQueue,
  enqueueIncidentJobs,
  connection,
};
