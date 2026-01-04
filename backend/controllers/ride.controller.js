const Ride = require("../models/Ride.model");
const { findEligibleCaptains } = require("../services/matching.service");
const { getIO } = require("../socket");

// const { io } = require("../server");


exports.requestRide = async (req, res) => {
  const io = getIO(); // ✅ always fresh, always initialized

  const ride = await Ride.create({
    rider: req.user._id,
    ...req.body,
    status: "MATCHING",
  });

  const matches = await findEligibleCaptains(ride);
  console.log("MATCHES FOUND:", matches);

  matches.forEach((m) => {
    io.to(`captain:${m.captainId}`).emit("ride:request", {
      rideId: ride._id,
      pickup: ride.pickup,
      drop: ride.drop,
      overlap: m.overlap,
      seatsRequired: ride.seatsRequired,
      matchedRoute: m.matchedRoute,
    });
  });

  res.json({ rideId: ride._id });
};

