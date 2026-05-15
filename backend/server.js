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

  socket.on("rider:location", ({ rideId, userId, lat, lng }) => {
  console.log(`📍 Rider location received for ride ${rideId}:`, { lat, lng });
  
  // Broadcast to all in the ride room
  io.to(`ride:${rideId}`).emit("rider:location", {
      userId,
      lat,
      lng,
    });
  });

  // Handle captain location updates
  socket.on("captain:location", ({ rideId, captainId, lat, lng }) => {
    console.log(`📍 Captain location received for ride ${rideId}:`, { lat, lng });
    
    // Broadcast to all in the ride room
    io.to(`ride:${rideId}`).emit("captain:location", {
      captainId,
      lat,
      lng,
    });
  });

  // Captain decision
  // In server.js, update the ride:decision handler:
  socket.on("ride:decision", async ({ rideId, captainId, decision, overlap, matchedRoute },callback) => {
  console.log("📥 Received ride:decision event");
  console.log("📥 Data:", { rideId, captainId, decision, overlap });
  console.log("📥 Socket ID:", socket.id);

  try {
    // If captain accepts, update ride with captain details
    if (decision === "ACCEPTED") {
      const Ride = require("./models/Ride.model");
      const User = require("./models/User.model");

      // Get ride and captain
      const ride = await Ride.findById(rideId);
      const captain = await User.findById(captainId);

      if (ride && captain) {
        ride.captain = captainId;
        ride.matchedRoute = typeof matchedRoute === "object" ? JSON.stringify(matchedRoute) : matchedRoute; // Store the overlapping route
        ride.status = "ACCEPTED";
        
        // Store captain details
        ride.captainDetails = {
          name: captain.name,
          phone: captain.phone,
          rating: captain.rating,
          vehicleDetails: captain.captainProfile?.vehicleDetails || {},
        };

        await ride.save();
        console.log("✅ Ride updated with captain acceptance");
      }
    }

    if (callback && typeof callback === "function") {
      callback({ 
        success: true, 
        message: "Decision received",
        rideId,
        decision 
      });
      console.log("✅ Acknowledgment sent to client");
    }
  
    io.to(`ride:${rideId}`).emit("ride:update", {
      captainId,
      decision, // ACCEPTED / REJECTED
      overlap,
    });
    
    console.log("✅ Sent ride:update to room:", `ride:${rideId}`);
  } catch (error) {
    console.error("❌ Error in ride:decision:", error);
    if (callback) {
      callback({ success: false, message: error.message });
    }
  }
  });

  socket.on("ride:started", ({ rideId, captainId }) => {
    console.log(`🚦 Ride started for ride ${rideId} by captain ${captainId}`);
    io.to(`ride:${rideId}`).emit("ride:started", { rideId, captainId });
  });

  // Chat: Join chat room
  socket.on("chat:join", ({ rideId, captainId, userId }) => {
    const chatRoom = `chat:${rideId}:${captainId}`;
    socket.join(chatRoom);
    console.log(`✅ User ${userId} joined chat room: ${chatRoom}`);
    
    // Notify other party that someone joined
    socket.to(chatRoom).emit("chat:userJoined", { userId });
  });

  // Chat: Send message
  socket.on("chat:message", ({ rideId, captainId, senderId, message, senderName }) => {
    const chatRoom = `chat:${rideId}:${captainId}`;
    
    const messageData = {
      rideId,
      captainId,
      senderId,
      senderName: senderName || "User",
      message,
      timestamp: new Date().toISOString(),
    };
    
    // Broadcast to all in the chat room (including sender)
    io.to(chatRoom).emit("chat:message", messageData);
    console.log(`💬 Message sent in ${chatRoom}:`, messageData);
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
