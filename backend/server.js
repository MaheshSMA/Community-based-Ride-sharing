require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// In-memory store (later Redis)
const captainLocations = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Captain connected:", socket.id);

  socket.on("captain:location", (data) => {
    const { captainId, lat, lng } = data;

    captainLocations.set(captainId, {
      lat,
      lng,
      updatedAt: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    console.log("Captain disconnected:", socket.id);
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = { io, captainLocations };
