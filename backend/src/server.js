const http = require("http");
const app = require("./app");
const { runMigrations } = require("./db/migrate");
const { startWorkers } = require("./jobs/workers");
const { initSocket } = require("./socket");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await runMigrations();
    startWorkers();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Backend listening on ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
