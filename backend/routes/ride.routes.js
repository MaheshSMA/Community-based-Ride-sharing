const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { requestRide, getRideDetails, completeRide } = require("../controllers/ride.controller");

router.post("/rides/request", auth, requestRide);

router.get("/rides/:rideId", getRideDetails);

router.post("/rides/:rideId/complete", auth, completeRide);

router.post("/captain/routes", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { route } = req.body;

    if (!route || !route.polyline) {
      return res.status(400).json({ message: "Route data missing" });
    }

    // 🔒 Ensure captain profile exists
    if (!user.captainProfile) {
      user.captainProfile = {};
    }

    if (!Array.isArray(user.captainProfile.routes)) {
      user.captainProfile.routes = [];
    }

    user.captainProfile.routes.push({
      polyline: route.polyline,
      distance: route.distance,
      duration: route.duration,
      priority: user.captainProfile.routes.length + 1,
    });

    user.captainProfile.isAvailable = true;

    await user.save();

    res.json({ message: "Route saved successfully" });
  } catch (err) {
    console.error("Save captain route error:", err);
    res.status(500).json({ message: "Error saving route" });
  }
});

// Add vehicle details endpoint
router.post("/captain/vehicle-details", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.activeRole !== "CAPTAIN") {
      return res.status(403).json({ message: "Only captains can add vehicle details" });
    }

    const { vehicleNumber, vehicleColor, vehicleModel } = req.body;

    if (!vehicleNumber || !vehicleColor || !vehicleModel) {
      return res.status(400).json({ message: "All vehicle details are required" });
    }

    // Ensure captain profile exists
    if (!user.captainProfile) {
      user.captainProfile = {};
    }

    user.captainProfile.vehicleDetails = {
      number: vehicleNumber.toUpperCase(),
      color: vehicleColor,
      model: vehicleModel,
    };

    await user.save();

    res.json({
      message: "Vehicle details saved successfully",
      vehicleDetails: user.captainProfile.vehicleDetails,
    });
  } catch (err) {
    console.error("Save vehicle details error:", err);
    res.status(500).json({ message: "Error saving vehicle details" });
  }
});

// Get captain vehicle details endpoint
router.get("/captain/:captainId/vehicle-details", async (req, res) => {
  try {
    const User = require("../models/User.model");
    const captain = await User.findById(req.params.captainId);

    if (!captain) {
      return res.status(404).json({ message: "Captain not found" });
    }

    res.json({
      name: captain.name,
      phone: captain.phone,
      rating: captain.rating,
      vehicleDetails: captain.captainProfile?.vehicleDetails || null,
    });
  } catch (err) {
    console.error("Get vehicle details error:", err);
    res.status(500).json({ message: "Error fetching vehicle details" });
  }
});

module.exports = router;
