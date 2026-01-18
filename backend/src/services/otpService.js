const axios = require("axios");
const crypto = require("crypto");

/**
 * Fast2SMS OTP Service
 * Using Quick Transactional SMS (doesn't require OTP verification)
 */

class OTPService {
  constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY;
    
    // OTP Settings
    this.otpLength = 6;
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
    this.maxAttempts = 3;
    
    // In-memory store
    this.otpStore = new Map();
    
    console.log("📱 OTP Service initialized");
    console.log("   Fast2SMS API Key:", this.apiKey ? "✅ Configured" : "❌ Missing");
  }

  /**
   * Generate a random OTP
   */
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP via Fast2SMS Quick SMS
   */
  async sendOTP(phone) {
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10) {
        return { success: false, message: "Invalid phone number" };
      }

      if (!this.apiKey) {
        console.error("❌ FAST2SMS_API_KEY not configured");
        return { success: false, message: "SMS service not configured" };
      }

      // Rate limiting
      const existing = this.otpStore.get(cleanPhone);
      if (existing && existing.count >= 5) {
        const timePassed = Date.now() - existing.firstSent;
        if (timePassed < 10 * 60 * 1000) {
          return { success: false, message: "Too many attempts. Please wait 10 minutes." };
        }
      }

      const otp = this.generateOTP();
      const message = `Your QuickMart verification code is ${otp}. Valid for 5 minutes. Do not share with anyone.`;

      console.log(`📤 Sending OTP ${otp} to ${cleanPhone}...`);

      // Use Quick Transactional SMS route (doesn't need OTP verification)
      const response = await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
          route: "q", // Quick transactional route
          message: message,
          language: "english",
          flash: 0,
          numbers: cleanPhone,
        },
        {
          headers: {
            "authorization": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📱 Fast2SMS Response:", JSON.stringify(response.data));

      if (response.data.return === true) {
        this.otpStore.set(cleanPhone, {
          otp,
          expiresAt: Date.now() + this.otpExpiry,
          attempts: 0,
          count: (existing?.count || 0) + 1,
          firstSent: existing?.firstSent || Date.now(),
        });

        console.log(`✅ OTP sent successfully to ${cleanPhone}`);
        
        return { 
          success: true, 
          message: "OTP sent successfully",
          ...(process.env.NODE_ENV !== "production" && { otp })
        };
      } else {
        console.error("❌ Fast2SMS Error:", response.data);
        return { 
          success: false, 
          message: response.data.message || "Failed to send OTP" 
        };
      }
    } catch (error) {
      console.error("❌ OTP Send Error:", error.response?.data || error.message);
      
      // Return more specific error
      const errorMsg = error.response?.data?.message || error.message || "Failed to send OTP";
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Verify OTP
   */
  verifyOTP(phone, otp) {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const stored = this.otpStore.get(cleanPhone);

    console.log(`🔐 Verifying OTP for ${cleanPhone}...`);

    if (!stored) {
      return { success: false, message: "OTP not found. Please request a new one." };
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(cleanPhone);
      return { success: false, message: "OTP expired. Please request a new one." };
    }

    if (stored.attempts >= this.maxAttempts) {
      this.otpStore.delete(cleanPhone);
      return { success: false, message: "Too many wrong attempts. Please request a new OTP." };
    }

    if (stored.otp !== otp) {
      stored.attempts += 1;
      return { 
        success: false, 
        message: `Invalid OTP. ${this.maxAttempts - stored.attempts} attempts remaining.` 
      };
    }

    this.otpStore.delete(cleanPhone);
    console.log(`✅ OTP verified for ${cleanPhone}`);
    return { success: true, message: "OTP verified successfully" };
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [phone, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(phone);
      }
    }
  }
}

const otpService = new OTPService();
setInterval(() => otpService.cleanupExpired(), 5 * 60 * 1000);

module.exports = otpService;