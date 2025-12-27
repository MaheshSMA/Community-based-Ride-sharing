const Ride = require("../models/Ride.model");

exports.requestRide = async (req, res) => {
  try {
    const {
      pickup,
      drop,
      seatsRequired,
      preferences,
      route,
    } = req.body;

    if (!pickup || !drop || !seatsRequired || !route) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const ride = await Ride.create({
      rider: req.user._id,
      pickup,
      drop,
      seatsRequired,
      preferences,
      route,
      status: "MATCHING",
    });

    res.json({
      message: "Ride request created",
      rideId: ride._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create ride" });
  }
};
