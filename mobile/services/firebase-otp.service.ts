// mobile/services/firebase-otp.service.ts
// ✅ Using React Native Firebase - NO reCAPTCHA needed!

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

let confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

const firebaseOTPService = {
  /**
   * Send OTP to phone number
   * @param phone - Phone number with country code (e.g., +91XXXXXXXXXX)
   */
  async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("📱 Sending OTP to:", phone);

      // Validate phone format
      if (!phone.startsWith('+')) {
        phone = `+91${phone.replace(/\D/g, '')}`;
      }

      // React Native Firebase - no reCAPTCHA needed!
      confirmationResult = await auth().signInWithPhoneNumber(phone);

      console.log("✅ OTP sent successfully");
      return { success: true };
    } catch (error: any) {
      console.error("❌ OTP Send Error:", error.code, error.message);

      let errorMessage = "Failed to send OTP";

      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = "Invalid phone number format";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Please try again later";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Check your internet connection";
          break;
        case 'auth/app-not-authorized':
          errorMessage = "App not authorized. Check Firebase configuration";
          break;
        case 'auth/missing-client-identifier':
          errorMessage = "Missing SHA-1 fingerprint in Firebase Console";
          break;
        default:
          errorMessage = error.message || "Failed to send OTP";
      }

      return { success: false, error: errorMessage };
    }
  },

  /**
   * Verify OTP code
   * @param code - 6-digit OTP code
   */
  async verifyOTP(code: string): Promise<{ 
    success: boolean; 
    idToken?: string; 
    user?: FirebaseAuthTypes.User; 
    error?: string 
  }> {
    try {
      if (!confirmationResult) {
        return { success: false, error: "OTP session expired. Please request a new OTP" };
      }

      const cleanCode = code.replace(/\D/g, '');
      if (cleanCode.length !== 6) {
        return { success: false, error: "Please enter a valid 6-digit OTP" };
      }

      console.log("🔐 Verifying OTP...");

      const result = await confirmationResult.confirm(cleanCode);

      if (!result.user) {
        return { success: false, error: "Verification failed" };
      }

      const token = await result.user.getIdToken();

      console.log("✅ OTP verified successfully");

      return {
        success: true,
        idToken: token,
        user: result.user,
      };
    } catch (error: any) {
      console.error("❌ OTP Verify Error:", error.code, error.message);

      let errorMessage = "Invalid OTP";

      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = "Invalid OTP code. Please check and try again";
          break;
        case 'auth/code-expired':
        case 'auth/session-expired':
          errorMessage = "OTP has expired. Please request a new one";
          break;
        default:
          errorMessage = error.message || "Failed to verify OTP";
      }

      return { success: false, error: errorMessage };
    }
  },

  /**
   * Resend OTP
   */
  async resendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    console.log("🔄 Resending OTP to:", phone);
    confirmationResult = null;
    return this.sendOTP(phone);
  },

  /**
   * Clear confirmation
   */
  clearConfirmation(): void {
    confirmationResult = null;
  },

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  },

  /**
   * Get ID token
   */
  async getIdToken(): Promise<string | null> {
    const user = auth().currentUser;
    return user ? await user.getIdToken() : null;
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await auth().signOut();
    confirmationResult = null;
  },
};

export default firebaseOTPService;