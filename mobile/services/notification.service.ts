// app/services/notification.service.ts
/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging for push notifications
 * 
 * INSTALLATION REQUIRED:
 * npm install @react-native-firebase/app @react-native-firebase/messaging
 */

// Conditional import to avoid errors if package not installed
let messaging: any;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.warn('⚠️ Firebase Messaging not installed. Run: npm install @react-native-firebase/messaging');
}

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import api from './api';

class NotificationService {
  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return false;
      }

      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('✅ iOS notification permission granted');
        } else {
          console.log('❌ iOS notification permission denied');
        }

        return enabled;
      } else {
        // Android 13+ requires permission
        if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('✅ Android notification permission granted');
            return true;
          } else {
            console.log('❌ Android notification permission denied');
            return false;
          }
        }

        // Android 12 and below - permission granted by default
        return true;
      }
    } catch (error) {
      console.error('❌ Permission request error:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return null;
      }

      const token = await messaging().getToken();
      console.log('✅ FCM Token:', token);
      return token;
    } catch (error) {
      console.error('❌ Get FCM Token Error:', error);
      return null;
    }
  }

  /**
   * Initialize notifications
   */
  async initialize(): Promise<void> {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not installed - Notifications disabled');
        return;
      }

      // Request permission
      const hasPermission = await this.requestPermission();

      if (!hasPermission) {
        console.log('⚠️ Notification permission not granted');
        return;
      }

      // Get FCM token
      const fcmToken = await this.getFCMToken();

      if (fcmToken) {
        // Send token to backend
        await this.updateFCMToken(fcmToken);
      }

      // Handle token refresh
      messaging().onTokenRefresh(async (token) => {
        console.log('🔄 FCM Token refreshed');
        await this.updateFCMToken(token);
      });

      // Handle foreground notifications
      messaging().onMessage(async (remoteMessage) => {
        console.log('📬 Foreground notification:', remoteMessage);
        
        // Show alert for foreground notifications
        if (remoteMessage.notification) {
          Alert.alert(
            remoteMessage.notification.title || 'Notification',
            remoteMessage.notification.body || '',
            [
              { text: 'Dismiss', style: 'cancel' },
              {
                text: 'View',
                onPress: () => this.handleNotificationPress(remoteMessage),
              },
            ]
          );
        }
      });

      // Handle background notifications
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('📬 Background notification:', remoteMessage);
      });

      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Notification initialization error:', error);
    }
  }

  /**
   * Update FCM token on backend
   */
  async updateFCMToken(fcmToken: string): Promise<void> {
    try {
      const response: any = await api.updateFCMToken(fcmToken);
      
      if (response.success) {
        console.log('✅ FCM token updated on backend');
      }
    } catch (error) {
      console.error('❌ Failed to update FCM token:', error);
    }
  }

  /**
   * Handle notification press
   */
  handleNotificationPress(remoteMessage: any): void {
    console.log('👆 Notification pressed:', remoteMessage);
    
    // Navigate based on notification type
    const { type, orderId, screen } = remoteMessage.data || {};

    // You can use your navigation service here
    // Example: navigationRef.navigate(screen, { orderId });
  }

  /**
   * Get initial notification (app opened from notification)
   */
  async getInitialNotification(): Promise<any> {
    try {
      if (!messaging) {
        return null;
      }

      const remoteMessage = await messaging().getInitialNotification();
      
      if (remoteMessage) {
        console.log('🚀 App opened from notification:', remoteMessage);
        return remoteMessage;
      }

      return null;
    } catch (error) {
      console.error('❌ Get initial notification error:', error);
      return null;
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return;
      }

      await messaging().subscribeToTopic(topic);
      console.log(`✅ Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return;
      }

      await messaging().unsubscribeFromTopic(topic);
      console.log(`✅ Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from topic ${topic}:`, error);
    }
  }
}

export default new NotificationService();