const axios = require("axios");
const crypto = require("crypto");

/**
 * Fast2SMS OTP Service
 * Sign up at: https://www.fast2sms.com
 * Get API key from: Dashboard → Dev API
 */

class OTPService {
  constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY;
    this.baseUrl = "https://www.fast2sms.com/dev/bulkV2";
    
    // OTP Settings
    this.otpLength = 6;
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
    this.maxAttempts = 3;
    
    // In-memory store (use Redis in production)
    this.otpStore = new Map();
    
    console.log("📱 OTP Service initialized");
    console.log("   Fast2SMS API Key:", this.apiKey ? "✅ Configured" : "❌ Missing");
  }

  /**
   * Generate a random OTP
   */
  generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  /**
   * Send OTP via Fast2SMS
   * @param {string} phone - 10 digit phone number
   * @returns {Promise<{success: boolean, message: string, otp?: string}>}
   */
  async sendOTP(phone) {
    try {
      // Validate phone
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10) {
        return { success: false, message: "Invalid phone number" };
      }

      // Check if API key is configured
      if (!this.apiKey) {
        console.error("❌ FAST2SMS_API_KEY not configured in .env");
        return { success: false, message: "SMS service not configured" };
      }

      // Check rate limiting (max 3 OTPs per 10 minutes)
      const existing = this.otpStore.get(cleanPhone);
      if (existing && existing.count >= 3) {
        const timePassed = Date.now() - existing.firstSent;
        if (timePassed < 10 * 60 * 1000) {
          return { 
            success: false, 
            message: "Too many attempts. Please wait 10 minutes." 
          };
        }
      }

      // Generate OTP
      const otp = this.generateOTP();
      
      console.log(`📤 Sending OTP ${otp} to ${cleanPhone}...`);

      // Send via Fast2SMS
      const response = await axios.get(this.baseUrl, {
        params: {
          authorization: this.apiKey,
          route: "otp",
          variables_values: otp,
          flash: 0,
          numbers: cleanPhone,
        },
      });

      console.log("📱 Fast2SMS Response:", response.data);

      if (response.data.return === true) {
        // Store OTP
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
          // Return OTP in development for testing
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
      return { 
        success: false, 
        message: "Failed to send OTP. Please try again." 
      };
    }
  }

  /**
   * Verify OTP
   * @param {string} phone - 10 digit phone number
   * @param {string} otp - 6 digit OTP
   * @returns {{success: boolean, message: string}}
   */
  verifyOTP(phone, otp) {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const stored = this.otpStore.get(cleanPhone);

    console.log(`🔐 Verifying OTP for ${cleanPhone}...`);
    console.log(`   Entered: ${otp}`);
    console.log(`   Stored: ${stored?.otp || 'none'}`);

    if (!stored) {
      return { success: false, message: "OTP not found. Please request a new one." };
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(cleanPhone);
      return { success: false, message: "OTP expired. Please request a new one." };
    }

    // Check attempts
    if (stored.attempts >= this.maxAttempts) {
      this.otpStore.delete(cleanPhone);
      return { success: false, message: "Too many wrong attempts. Please request a new OTP." };
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts += 1;
      const remaining = this.maxAttempts - stored.attempts;
      return { 
        success: false, 
        message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
      };
    }

    // Success - clear OTP
    this.otpStore.delete(cleanPhone);
    console.log(`✅ OTP verified successfully for ${cleanPhone}`);
    return { success: true, message: "OTP verified successfully" };
  }

  /**
   * Clear expired OTPs (call periodically)
   */
  cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;
    for (const [phone, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(phone);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired OTPs`);
    }
  }
}

// Singleton instance
const otpService = new OTPService();

// Cleanup every 5 minutes
setInterval(() => otpService.cleanupExpired(), 5 * 60 * 1000);

module.exports = otpService;