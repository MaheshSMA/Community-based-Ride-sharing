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

// Get ride details including captain info and matched route
exports.getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId).populate("rider", "name phone rating").populate("captain", "name phone rating captainProfile");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    res.json({
      success: true,
      ride: {
        _id: ride._id,
        status: ride.status,
        pickup: ride.pickup,
        drop: ride.drop,
        route: ride.route,
        matchedRoute: ride.matchedRoute,
        captainDetails: ride.captainDetails,
        pointsEarned: ride.pointsEarned,
        createdAt: ride.createdAt,
        updatedAt: ride.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error getting ride details:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Complete ride and transfer points
exports.completeRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { distanceInKm } = req.body;

    if (distanceInKm === undefined) {
      return res.status(400).json({
        success: false,
        message: "distanceInKm is required"
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    if (ride.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Ride already completed"
      });
    }

    // Update ride status
    ride.status = "COMPLETED";
    
    // Calculate points: 1 point per km
    const pointsEarned = Math.ceil(distanceInKm);
    ride.pointsEarned = pointsEarned;

    await ride.save();

    res.json({
      success: true,
      message: "Ride completed successfully",
      pointsEarned,
      ride
    });
  } catch (error) {
    console.error("Error completing ride:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
