const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

    status: {
      type: String,
      enum: ["REQUESTED", "MATCHING", "ACCEPTED", "CANCELLED"],
      default: "REQUESTED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", RideSchema);
