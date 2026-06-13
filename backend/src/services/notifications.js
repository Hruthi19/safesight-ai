const axios = require("axios");

async function sendSlackNotification({ title, message, severity }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[SLACK] Skipped (SLACK_WEBHOOK_URL not set)");
    return { sent: false, reason: "not configured" };
  }

  const emoji = severity === "high" ? "🔥" : "⚠️";
  await axios.post(webhookUrl, {
    text: `${emoji} *${title}*\n${message}`,
  });

  console.log("[SLACK] Notification sent:", title);
  return { sent: true };
}

async function sendEmailNotification({ subject, body }) {
  const host = process.env.SMTP_HOST;
  const to = process.env.NOTIFY_EMAIL;

  if (!host || !to) {
    console.log("[EMAIL] Skipped (SMTP_HOST or NOTIFY_EMAIL not set)");
    return { sent: false, reason: "not configured" };
  }

  // Log email for local dev; wire real SMTP when credentials are provided
  console.log("[EMAIL] To:", to);
  console.log("[EMAIL] Subject:", subject);
  console.log("[EMAIL] Body:", body);

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });
    console.log("[EMAIL] Sent successfully");
    return { sent: true };
  }

  return { sent: false, reason: "smtp credentials missing" };
}

async function notifyIncident({ incidentId, incidentType, severity, status }) {
  const title = `SafeSight Alert: ${incidentType.replace(/_/g, " ")}`;
  const message =
    `Incident #${incidentId} — ${severity} severity — status: ${status}\n` +
    `View: ${process.env.FRONTEND_URL || "http://localhost:5173"}/incidents/${incidentId}`;

  await sendSlackNotification({ title, message, severity });
  await sendEmailNotification({ subject: title, body: message });
}

async function notifyEscalation({ incidentId, severity }) {
  const title = `ESCALATION: Incident #${incidentId}`;
  const message =
    `Unresolved ${severity} severity incident requires immediate attention.\n` +
    `View: ${process.env.FRONTEND_URL || "http://localhost:5173"}/incidents/${incidentId}`;

  await sendSlackNotification({ title, message, severity });
  await sendEmailNotification({ subject: title, body: message });
}

module.exports = {
  notifyIncident,
  notifyEscalation,
  sendSlackNotification,
  sendEmailNotification,
};
