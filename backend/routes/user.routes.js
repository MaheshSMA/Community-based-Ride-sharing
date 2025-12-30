const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { switchRole, getRideMetrics } = require("../controllers/user.controller");

router.post("/switch-role", auth, switchRole);
router.get("/metrics", auth, getRideMetrics);

module.exports = router;
