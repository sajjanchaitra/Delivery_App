// backend/src/services/firebase-auth.service.js
const admin = require("../config/firebase");

class FirebaseAuthService {
  /**
   * Verify Firebase ID Token
   * @param {string} idToken - Firebase ID token from client
   * @returns {Promise<object>} Decoded token with user info
   */
  async verifyIdToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log("✅ Firebase token verified:", decodedToken.phone_number);
      return {
        success: true,
        uid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number,
        decodedToken,
      };
    } catch (error) {
      console.error("❌ Firebase token verification failed:", error.message);
      throw new Error("Invalid or expired Firebase token");
    }
  }

  /**
   * Get user by phone number
   * @param {string} phoneNumber - Phone number in E.164 format (+91xxxxxxxxxx)
   */
  async getUserByPhone(phoneNumber) {
    try {
      const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
      return {
        success: true,
        user: userRecord,
      };
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return {
          success: false,
          error: "User not found",
        };
      }
      throw error;
    }
  }

  /**
   * Create Firebase user
   * @param {string} phoneNumber - Phone number in E.164 format
   */
  async createUser(phoneNumber) {
    try {
      const userRecord = await admin.auth().createUser({
        phoneNumber,
      });
      console.log("✅ Firebase user created:", userRecord.uid);
      return {
        success: true,
        user: userRecord,
      };
    } catch (error) {
      console.error("❌ Firebase user creation failed:", error.message);
      throw error;
    }
  }

  /**
   * Delete Firebase user
   * @param {string} uid - Firebase user UID
   */
  async deleteUser(uid) {
    try {
      await admin.auth().deleteUser(uid);
      console.log("✅ Firebase user deleted:", uid);
      return { success: true };
    } catch (error) {
      console.error("❌ Firebase user deletion failed:", error.message);
      throw error;
    }
  }

  /**
   * Update user phone number
   * @param {string} uid - Firebase user UID
   * @param {string} newPhoneNumber - New phone number
   */
  async updateUserPhone(uid, newPhoneNumber) {
    try {
      await admin.auth().updateUser(uid, {
        phoneNumber: newPhoneNumber,
      });
      console.log("✅ Phone number updated for user:", uid);
      return { success: true };
    } catch (error) {
      console.error("❌ Phone update failed:", error.message);
      throw error;
    }
  }
}

module.exports = new FirebaseAuthService();