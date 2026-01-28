// app/services/firebase-otp.service.ts
/**
 * Firebase OTP Service
 * Handles phone authentication with Firebase
 * 
 * INSTALLATION REQUIRED:
 * npm install @react-native-firebase/app @react-native-firebase/auth
 */

// Conditional import to avoid errors if package not installed
let auth: any;
let FirebaseAuthTypes: any;

try {
  auth = require('@react-native-firebase/auth').default;
  FirebaseAuthTypes = require('@react-native-firebase/auth');
} catch (error) {
  console.warn('⚠️ Firebase Auth not installed. Run: npm install @react-native-firebase/auth');
}

interface OTPSendResult {
  success: boolean;
  error?: string;
}

interface OTPVerifyResult {
  success: boolean;
  idToken?: string;
  error?: string;
}

class FirebaseOTPService {
  private confirmation: any = null;

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number with country code (+91xxxxxxxxxx)
   */
  async sendOTP(phoneNumber: string): Promise<OTPSendResult> {
    try {
      if (!auth) {
        return {
          success: false,
          error: 'Firebase Auth not installed. Please install @react-native-firebase/auth',
        };
      }
      // Ensure phone number is in correct format
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      console.log('📱 Sending OTP to:', formattedPhone);

      // Send verification code
      this.confirmation = await auth().signInWithPhoneNumber(formattedPhone);

      console.log('✅ OTP sent successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ OTP Send Error:', error);
      
      let errorMessage = 'Failed to send OTP';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify OTP code
   * @param code - 6-digit OTP code
   */
  async verifyOTP(code: string): Promise<OTPVerifyResult> {
    try {
      if (!auth) {
        return {
          success: false,
          error: 'Firebase Auth not installed',
        };
      }
      if (!this.confirmation) {
        return { 
          success: false, 
          error: 'No OTP sent. Please request OTP first' 
        };
      }

      console.log('🔐 Verifying OTP:', code);

      // Confirm the code
      const userCredential = await this.confirmation.confirm(code);

      // Get ID token
      const idToken = await userCredential.user.getIdToken();

      console.log('✅ OTP verified successfully');
      console.log('📱 Phone:', userCredential.user.phoneNumber);

      // Clear confirmation
      this.confirmation = null;

      return { 
        success: true, 
        idToken 
      };
    } catch (error: any) {
      console.error('❌ OTP Verification Error:', error);

      let errorMessage = 'Invalid OTP code';

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please try again';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP expired. Please request a new one';
      } else if (error.code === 'auth/session-expired') {
        errorMessage = 'Session expired. Please request a new OTP';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Resend OTP
   * @param phoneNumber - Phone number with country code
   */
  async resendOTP(phoneNumber: string): Promise<OTPSendResult> {
    // Reset confirmation
    this.confirmation = null;
    
    // Send new OTP
    return this.sendOTP(phoneNumber);
  }

  /**
   * Clear confirmation state
   */
  clearConfirmation(): void {
    this.confirmation = null;
  }

  /**
   * Check if Firebase Auth is available
   */
  isAvailable(): boolean {
    return !!auth;
  }
}

export default new FirebaseOTPService();