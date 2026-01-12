const express = require("express");
const { otpLogin } = require("../controllers/auth.controller");

const router = express.Router();
router.post("/otp-login", otpLogin);

module.exports = router;
