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
