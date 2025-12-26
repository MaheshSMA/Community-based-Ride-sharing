const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");

router.post("/captain/routes", auth, async (req, res) => {
  try {
    req.user.captainProfile.routes = req.body.routes.map((r, i) => ({
      polyline: JSON.stringify(r),
      priority: i + 1,
    }));
    req.user.captainProfile.isAvailable = true;
    await req.user.save();

    res.json({ message: "Routes saved" });
  } catch (err) {
    res.status(500).json({ message: "Error saving routes" });
  }
});

module.exports = router;
