// services/notification.service.ts
/**
 * Push Notification Service for EXPO
 * Uses Expo Notifications (not @react-native-firebase/messaging)
 * 
 * INSTALLATION REQUIRED:
 * npx expo install expo-notifications expo-device expo-constants
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Configure notification behavior - FIX: Added missing properties
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // ✅ ADDED
    shouldShowList: true,    // ✅ ADDED
  }),
});

class NotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission denied');
        return false;
      }

      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('❌ Permission request error:', error);
      return false;
    }
  }

  /**
   * Get Expo Push Token (FCM/APNs token)
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('⚠️ Push tokens only work on physical devices');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('❌ Missing Expo project ID in app.json');
        console.error('   Run: npx eas init');
        console.error('   Then add projectId to app.json under extra.eas.projectId');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('✅ Expo Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Get Push Token Error:', error);
      return null;
    }
  }

  /**
   * Get device push token (FCM for Android, APNs for iOS)
   */
  async getDevicePushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const token = await Notifications.getDevicePushTokenAsync();
      console.log('✅ Device Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Get Device Token Error:', error);
      return null;
    }
  }

  /**
   * Initialize notifications
   */
  async initialize(): Promise<void> {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();

      if (!hasPermission) {
        console.log('⚠️ Notification permission not granted');
        return;
      }

      // Get push token
      const expoPushToken = await this.getExpoPushToken();
      const deviceToken = await this.getDevicePushToken();

      if (expoPushToken) {
        // Send token to backend
        await this.updateFCMToken(expoPushToken);
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }

      // Listen for notifications received while app is open
      this.notificationListener = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('📬 Notification received:', notification);
        }
      );

      // Listen for notification responses (user tapped notification)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('👆 Notification tapped:', response);
          this.handleNotificationPress(response.notification);
        }
      );

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
  handleNotificationPress(notification: Notifications.Notification): void {
    console.log('👆 Notification pressed:', notification);
    
    // Navigate based on notification type
    const { type, orderId, screen } = notification.request.content.data || {};

    // You can use your navigation service here
    // Example: navigationRef.navigate(screen, { orderId });
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: trigger || null, // null = show immediately
      });

      console.log('✅ Local notification scheduled:', id);
      return id;
    } catch (error) {
      console.error('❌ Schedule notification error:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Cancel notification error:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Cancel all notifications error:', error);
    }
  }

  /**
   * Clear all delivered notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Clear notifications error:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      console.error('❌ Get badge count error:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('✅ Badge count set:', count);
    } catch (error) {
      console.error('❌ Set badge count error:', error);
    }
  }

  /**
   * Cleanup listeners - FIX: Use correct method
   */
  cleanup(): void {
    // ✅ FIXED: Use remove() method on the subscription itself
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export default new NotificationService();