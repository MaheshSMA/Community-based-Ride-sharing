const User = require("../models/User.model");

exports.switchRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["RIDER", "CAPTAIN"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!req.user.roles.includes(role)) {
      req.user.roles.push(role);
    }

    req.user.activeRole = role;
    await req.user.save();

    res.json({
      message: "Role switched successfully",
      activeRole: role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      rating: user.rating,
      points: user.points ?? 100,
      name: user.name,
      phone: user.phone,
      activeRole: user.activeRole,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateRating = async (req, res) => {
  try {
    const { targetUserId, points } = req.body;

    if (!targetUserId || points === undefined) {
      return res.status(400).json({
        success: false,
        message: "targetUserId and points are required"
      });
    }

    // Validate points are within acceptable range
    if (Math.abs(points) !== 0.05) {
      return res.status(400).json({
        success: false,
        message: "Points must be +0.05 or -0.05"
      });
    }

    // Find target user and update rating
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update rating (keep it between 1 and 5)
    targetUser.rating = Math.max(1, Math.min(5, targetUser.rating + points));
    await targetUser.save();

    res.json({
      success: true,
      message: "Rating updated successfully",
      newRating: targetUser.rating
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.transferPoints = async (req, res) => {
  try {
    const { rideId, captainId, riderId, distanceInKm } = req.body;

    if (!rideId || !captainId || !riderId || distanceInKm === undefined) {
      return res.status(400).json({
        success: false,
        message: "rideId, captainId, riderId, and distanceInKm are required"
      });
    }

    // Get Ride model
    const Ride = require("../models/Ride.model");
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    // Check if points already transferred
    if (ride.pointsTransferred) {
      return res.status(400).json({
        success: false,
        message: "Points already transferred for this ride"
      });
    }

    // Calculate points: 1 point per km (rounded)
    const pointsToTransfer = Math.ceil(distanceInKm);

    // Get captain and rider
    const captain = await User.findById(captainId);
    const rider = await User.findById(riderId);

    if (!captain || !rider) {
      return res.status(404).json({
        success: false,
        message: "Captain or rider not found"
      });
    }

    // Transfer points
    captain.points = (captain.points || 100) + pointsToTransfer;
    rider.points = Math.max(0, (rider.points || 100) - pointsToTransfer);

    // Update ride
    ride.pointsEarned = pointsToTransfer;
    ride.pointsTransferred = true;

    await captain.save();
    await rider.save();
    await ride.save();

    res.json({
      success: true,
      message: "Points transferred successfully",
      pointsTransferred: pointsToTransfer,
      captainNewBalance: captain.points,
      riderNewBalance: rider.points,
    });
  } catch (error) {
    console.error("Error transferring points:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};