const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const generateOTP = require("../utils/otp");

exports.sendOTP = async (req, res) => {
  try {
    const { phone, name, gender } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    let user = await User.findOne({ phone });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    if (!user) {
      if (!name || !gender) {
        return res.status(400).json({
          message: "Name and gender required for new user",
        });
      }

      user = new User({
        name,
        phone,
        gender,
        otp: { code: otp, expiresAt },
      });
    } else {
      user.otp = { code: otp, expiresAt };
    }

    await user.save();

    // MOCK OTP (later replace with SMS)
    console.log(` OTP for ${phone}: ${otp}`);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required" });
    }

    const user = await User.findOne({ phone });

    if (!user || !user.otp) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id.toString(), 
        role: user.activeRole, 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        roles: user.roles,
        activeRole: user.activeRole,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
