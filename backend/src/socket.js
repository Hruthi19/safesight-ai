let io = null;

function initSocket(socketServer) {
  const { Server } = require("socket.io");
  io = new Server(socketServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("[SOCKET] Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("[SOCKET] Client disconnected:", socket.id);
    });
  });

  console.log("Socket.IO initialized");
  return io;
}

function emitIncident(event, incident) {
  if (io) {
    io.emit(event, incident);
  }
}

module.exports = { initSocket, emitIncident };
