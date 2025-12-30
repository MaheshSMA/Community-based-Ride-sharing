const mongoose = require('mongoose');
const RideHistory = require('../models/RideHistory.model');

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


exports.getRideMetrics = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: 'User not found in request' });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Fetch basic user fields
    const user = req.user; // loaded by auth middleware

    // Aggregate RideHistory for the user
    const agg = await RideHistory.aggregate([
      { $match: { $or: [{ rider: userId }, { captain: userId }] } },
      {
        $facet: {
          completedCount: [
            { $match: { status: 'COMPLETED' } },
            { $count: 'count' },
          ],
          cancelledCountByUser: [
            { $match: { status: 'CANCELLED', cancelledBy: userId } },
            { $count: 'count' },
          ],
          ratingStats: [
            { $match: { captain: userId, 'riderReview.rating': { $exists: true } } },
            {
              $group: {
                _id: null,
                totalPoints: { $sum: '$riderReview.rating' },
                ratingCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const facet = agg[0] || {};

    const totalRidesCompleted = (facet.completedCount && facet.completedCount[0] && facet.completedCount[0].count) || 0;
    const totalRidesCancelled = (facet.cancelledCountByUser && facet.cancelledCountByUser[0] && facet.cancelledCountByUser[0].count) || 0;
    const totalRatingPoints = (facet.ratingStats && facet.ratingStats[0] && facet.ratingStats[0].totalPoints) || 0;
    const ratingCount = (facet.ratingStats && facet.ratingStats[0] && facet.ratingStats[0].ratingCount) || 0;

    const accountAge = user.accountAge || user.createdAt;

    res.json({
      accountAge,
      isVerified: !!user.isVerified,
      totalRidesCompleted,
      totalRidesCancelled,
      totalRatingPoints,
      ratingCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
