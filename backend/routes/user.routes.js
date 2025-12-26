const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { switchRole } = require("../controllers/user.controller");

router.post("/switch-role", auth, switchRole);

module.exports = router;
