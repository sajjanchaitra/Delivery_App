const admin = require("../config/firebase");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.otpLogin = async (req, res) => {
  try {
    const { token, role } = req.body;

    const decoded = await admin.auth().verifyIdToken(token);
    const phone = decoded.phone_number;

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({ phone, role });
    }

    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token: authToken, user });
  } catch (err) {
    res.status(401).json({ error: "Invalid OTP" });
  }
};
