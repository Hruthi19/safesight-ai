const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const incidentRoutes = require("./routes/incidents");
const webhookRoutes = require("./routes/webhooks");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/incidents", incidentRoutes);
app.use("/webhooks", webhookRoutes);

module.exports = app;
