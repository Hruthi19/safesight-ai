const express = require("express");
const cors = require("cors");

const incidents = require("./routes/incidents");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/incidents", incidents);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});