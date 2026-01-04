require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { Server } = require("socket.io");
const { captainLocations } = require("./store/captainLocation.store");
const { setIO } = require("./socket");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

setIO(io);
// In-memory store (later Redis)
// const captainLocations = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Captain joins personal room
  socket.on("captain:join", ({ captainId }) => {
    socket.join(`captain:${captainId}`);
  });

  socket.on("captain:location", ({ captainId, lat, lng }) => {
    captainLocations.set(captainId, { lat, lng });
  });

  // Rider joins ride room
  socket.on("ride:join", ({ rideId }) => {
    socket.join(`ride:${rideId}`);
  });

  // Captain decision
  socket.on("ride:decision", ({ rideId, captainId, decision, overlap }) => {
    io.to(`ride:${rideId}`).emit("ride:update", {
      captainId,
      decision, // ACCEPTED / REJECTED
      overlap,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
