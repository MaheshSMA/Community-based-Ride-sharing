const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ---------- Captain Details (filled when accepted) ----------
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    captainDetails: {
      name: String,
      phone: String,
      rating: Number,
      vehicleDetails: {
        number: String,
        color: String,
        model: String,
      },
    },

    communityName: {
      type: String,
      required: true,
    },

    pickup: {
      lat: Number,
      lng: Number,
      label: String,
    },

    drop: {
      lat: Number,
      lng: Number,
      label: String,
    },

    seatsRequired: {
      type: Number,
      required: true,
      min: 1,
    },

    preferences: {
      vehicleType: {
        type: String,
        enum: ["bike", "car", "auto"],
      },
      onlyWomen: {
        type: Boolean,
        default: false,
      },
    },

    route: {
      polyline: String,
      distance: Number, // meters
      duration: Number, // seconds
    },

    // ---------- Overlapping Route (for map display) ----------
    matchedRoute: {
      type: String, // polyline
    },

    // ---------- Points System ----------
    pointsEarned: {
      type: Number,
      default: 0,
    },

    pointsTransferred: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["REQUESTED", "MATCHING", "ACCEPTED", "CANCELLED", "COMPLETED"],
      default: "REQUESTED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", RideSchema);
