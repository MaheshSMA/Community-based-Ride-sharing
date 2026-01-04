const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { requestRide } = require("../controllers/ride.controller");

router.post("/rides/request", auth, requestRide);

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


module.exports = router;
