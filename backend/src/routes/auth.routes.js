const router = require("express").Router();

router.post("/login", (req, res) => {
  const { phone, role } = req.body;
  res.json({ message: "OTP sent", phone, role });
});

router.post("/verify-otp", (req, res) => {
  const { phone, role } = req.body;
  res.json({ token: "FAKE_JWT_TOKEN", role });
});

module.exports = router;
