require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { Server } = require("socket.io");
const { captainLocations , updateCaptainLocation } = require("./store/captainLocation.store");
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
    console.log("🔵 Captain join received:", captainId);
    console.log("🔵 Captain ID type:", typeof captainId);
    console.log("🔵 Socket ID:", socket.id);
    
    const roomName = `captain:${captainId}`;
    socket.join(roomName);
    
    // Verify join
    const room = io.sockets.adapter.rooms.get(roomName);
    console.log(`✅ Captain ${captainId} joined room ${roomName}`);
    console.log(`✅ Sockets in room now:`, room ? room.size : 0);
  });

  socket.on("captain:location", ({ captainId, lat, lng }) => {
    updateCaptainLocation(captainId, lat, lng);
  });

  // Rider joins ride room
  socket.on("ride:join", ({ rideId }) => {
    socket.join(`ride:${rideId}`);
  });

  // Captain decision
  // In server.js, update the ride:decision handler:
  socket.on("ride:decision", ({ rideId, captainId, decision, overlap }) => {
  console.log("📥 Received ride:decision event");
  console.log("📥 Data:", { rideId, captainId, decision, overlap });
  console.log("📥 Socket ID:", socket.id);

  // if (callback) {
  //   callback({ 
  //     success: true, 
  //     message: "Decision received",
  //     rideId,
  //     decision 
  //   });
  //   console.log("✅ Acknowledgment sent to client");
  // }
  
  io.to(`ride:${rideId}`).emit("ride:update", {
    captainId,
    decision, // ACCEPTED / REJECTED
    overlap,
  });
  
  console.log("✅ Sent ride:update to room:", `ride:${rideId}`);
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
