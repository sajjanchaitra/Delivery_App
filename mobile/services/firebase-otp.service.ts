// app/services/firebase-otp.service.ts
/**
 * Firebase OTP Service for EXPO
 * Uses Firebase JS SDK (not @react-native-firebase)
 * 
 * INSTALLATION REQUIRED:
 * npx expo install firebase
 */

import { getAuth, signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
  private confirmation: ConfirmationResult | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  /**
   * Initialize reCAPTCHA verifier (required for web)
   * For React Native, this is handled automatically by Firebase
   */
  initRecaptcha(containerId: string = 'recaptcha-container'): void {
    if (typeof window !== 'undefined' && !this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('✅ reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('⚠️ reCAPTCHA expired');
        }
      });
    }
  }

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number with country code (+91xxxxxxxxxx)
   */
  async sendOTP(phoneNumber: string): Promise<OTPSendResult> {
    try {
      // Ensure phone number is in correct format
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      console.log('📱 Sending OTP to:', formattedPhone);

      // Send verification code
      this.confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        this.recaptchaVerifier!
      );

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
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Verification failed. Please try again';
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