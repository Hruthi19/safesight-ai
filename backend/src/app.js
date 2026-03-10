const express = require("express");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/incidents", (req, res) => {
  res.status(201).json({ message: "Incident created" });
});

app.get("/incidents", (req, res) => {
  res.status(200).json([]);
});

module.exports = app;