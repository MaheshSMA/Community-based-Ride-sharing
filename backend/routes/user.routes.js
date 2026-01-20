const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { switchRole } = require("../controllers/user.controller");

router.post("/switch-role", auth, switchRole);

router.post("/setup-community", auth, async (req, res) => {
  try {
    console.log("entered");
    const { communityName, communityId } = req.body;

    if (!communityName || !communityId) {
      return res.status(400).json({ 
        success: false, 
        message: "Community name and ID are required" 
      });
    }

    // Use req.user directly from auth middleware
    req.user.community = {
      name: communityName,
      communityId: communityId,
      joinedAt: new Date(),
    };
    req.user.isCommunityVerified = true;

    // Save the updated user
    await req.user.save();

    res.json({
      success: true,
      message: "Community setup completed",
      user: req.user,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;