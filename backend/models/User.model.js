const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // ---------- Basic Identity ----------
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    // ---------- Auth ----------
    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      code: String,
      expiresAt: Date,
    },

    // ---------- Roles ----------
    roles: {
      type: [String],
      enum: ["RIDER", "CAPTAIN"],
      default: ["RIDER"],
    },

    activeRole: {
      type: String,
      enum: ["RIDER", "CAPTAIN"],
      default: "RIDER",
    },

    // ---------- Rider Preferences ----------
    riderPreferences: {
      vehicleType: {
        type: String,
        enum: ["bike", "car", "auto"],
      },

      onlyWomen: {
        type: Boolean,
        default: false,
      },
    },

    // ---------- Captain Details ----------
    captainProfile: {
      vehicleType: {
        type: String,
        enum: ["bike", "car", "auto"],
      },

      seatsAvailable: {
        type: Number,
        min: 1,
        max: 6,
      },

      routes: [
        {
          polyline: String,        // Geoapify route polyline
          distance: Number,        // meters
          duration: Number,        // seconds
          priority: Number,        // route preference
        },
      ],

      isAvailable: {
        type: Boolean,
        default: false,
      },
    },

    community: {
      name: {
        type: String,
        required: false,
        trim: true,
      },
      communityId: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // Allows multiple null values
      },
      joinedAt: {
        type: Date,
        default: null,
      },
    },

    // Verification status
    isCommunityVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
