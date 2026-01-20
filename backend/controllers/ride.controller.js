const Ride = require("../models/Ride.model");
const { findEligibleCaptains } = require("../services/matching.service");
const { getIO } = require("../socket");

// const { io } = require("../server");


exports.requestRide = async (req, res) => {
  const io = getIO(); // ✅ always fresh, always initialized
  // Get community info from authenticated user (req.user is set by auth middleware)
    const communityId = req.user.community?.communityId;
    const communityName = req.user.community?.name;

    if (!communityId) {
      return res.status(400).json({
        success: false,
        message: "User must setup community before requesting a ride"
      });
    }

  const ride = await Ride.create({

    rider: req.user._id,
    communityId,
    communityName,
    ...req.body,
    status: "MATCHING",
  });

  

  const matches = await findEligibleCaptains(ride);
  console.log("MATCHES FOUND:", matches);

  matches.forEach((m) => {
    const roomName = `captain:${m.captainId}`;
    console.log("📤 Sending ride:request to room:", roomName);
    console.log("📤 Captain ID:", m.captainId);
    console.log("📤 Captain ID type:", typeof m.captainId);
    
    // Check if room exists and has sockets
    const room = io.sockets.adapter.rooms.get(roomName);
    const socketCount = room ? room.size : 0;
    console.log(`📤 Sockets in room ${roomName}:`, socketCount);
    
    if (socketCount === 0) {
      console.warn("⚠️ WARNING: No sockets in room! Event will not be delivered.");
    }
    
    io.to(roomName).emit("ride:request", {
      rideId: ride._id,
      pickup: ride.pickup,
      drop: ride.drop,
      overlap: m.overlap,
      seatsRequired: ride.seatsRequired,
      matchedRoute: m.matchedRoute,
    });
    
    console.log("✅ Event emitted to room:", roomName);
  });

  res.json({ rideId: ride._id });
};

