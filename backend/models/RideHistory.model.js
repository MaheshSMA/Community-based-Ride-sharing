const mongoose = require("mongoose");

const RideHistorySchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      unique: true,
    },

    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["REQUESTED", "MATCHING", "ACCEPTED", "CANCELLED", "COMPLETED"],
      required: true,
    },

    events: [
      {
        type: {
          type: String,
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        at: Date,
        meta: mongoose.Schema.Types.Mixed,
      },
    ],

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledAt: Date,

    completedAt: Date,

    riderReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
  },
  { timestamps: true }
);

// `ride` already has `unique: true` on the field definition above.
// Avoid declaring the same index twice to prevent duplicate-index warnings.

module.exports = mongoose.model("RideHistory", RideHistorySchema);
