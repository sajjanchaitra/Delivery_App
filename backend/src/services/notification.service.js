// backend/src/services/notification.service.js
const admin = require("../config/firebase");
const User = require("../models/User");

class NotificationService {
  /**
   * Send push notification to a single user
   * @param {string} userId - MongoDB user ID
   * @param {object} notification - Notification payload
   */
  async sendToUser(userId, notification) {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.fcmToken) {
        console.log(`⚠️ No FCM token found for user: ${userId}`);
        return { success: false, error: "No FCM token" };
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "orders",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log("✅ Notification sent successfully:", response);
      
      return { success: true, messageId: response };
    } catch (error) {
      console.error("❌ Notification send failed:", error.message);
      
      // Remove invalid FCM token
      if (error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered") {
        await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
        console.log("🗑️ Removed invalid FCM token for user:", userId);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to multiple users
   * @param {Array<string>} userIds - Array of MongoDB user IDs
   * @param {object} notification - Notification payload
   */
  async sendToMultipleUsers(userIds, notification) {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        fcmToken: { $exists: true, $ne: null },
      });

      if (users.length === 0) {
        console.log("⚠️ No users with FCM tokens found");
        return { success: false, error: "No valid tokens" };
      }

      const tokens = users.map(user => user.fcmToken);

      const message = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "orders",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`✅ Notifications sent: ${response.successCount}/${tokens.length}`);
      
      // Remove failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        await User.updateMany(
          { fcmToken: { $in: failedTokens } },
          { $unset: { fcmToken: 1 } }
        );
        console.log(`🗑️ Removed ${failedTokens.length} invalid FCM tokens`);
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error("❌ Multicast notification failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification by user role
   * @param {string} role - User role (customer, vendor, delivery, admin)
   * @param {object} notification - Notification payload
   */
  async sendToRole(role, notification) {
    try {
      const users = await User.find({
        role,
        fcmToken: { $exists: true, $ne: null },
      });

      if (users.length === 0) {
        console.log(`⚠️ No ${role}s with FCM tokens found`);
        return { success: false, error: "No users found" };
      }

      const userIds = users.map(user => user._id.toString());
      return await this.sendToMultipleUsers(userIds, notification);
    } catch (error) {
      console.error(`❌ Send to ${role} failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Order notifications
   */
  async notifyOrderPlaced(orderId, order) {
    // Notify customer
    await this.sendToUser(order.customer, {
      title: "Order Placed Successfully! 🎉",
      body: `Your order #${orderId.slice(-6)} has been placed. Total: ₹${order.total}`,
      data: {
        type: "order_placed",
        orderId: orderId.toString(),
        screen: "OrderDetails",
      },
    });

    // Notify vendor
    await this.sendToUser(order.vendor, {
      title: "New Order Received! 📦",
      body: `You have a new order #${orderId.slice(-6)} worth ₹${order.total}`,
      data: {
        type: "new_order",
        orderId: orderId.toString(),
        screen: "VendorOrderDetails",
      },
    });
  }

  async notifyOrderAccepted(orderId, order) {
    await this.sendToUser(order.customer, {
      title: "Order Accepted! ✅",
      body: `Your order #${orderId.slice(-6)} has been accepted by the vendor`,
      data: {
        type: "order_accepted",
        orderId: orderId.toString(),
        screen: "OrderDetails",
      },
    });
  }

  async notifyOrderReady(orderId, order) {
    await this.sendToUser(order.customer, {
      title: "Order Ready for Pickup! 🎉",
      body: `Your order #${orderId.slice(-6)} is ready for delivery`,
      data: {
        type: "order_ready",
        orderId: orderId.toString(),
        screen: "OrderDetails",
      },
    });

    // Notify available delivery partners
    await this.sendToRole("delivery", {
      title: "New Delivery Available! 🚴",
      body: `Order #${orderId.slice(-6)} is ready for pickup`,
      data: {
        type: "delivery_available",
        orderId: orderId.toString(),
        screen: "DeliveryOrders",
      },
    });
  }

  async notifyOrderPickedUp(orderId, order) {
    await this.sendToUser(order.customer, {
      title: "Order Picked Up! 🚚",
      body: `Your order #${orderId.slice(-6)} is on the way`,
      data: {
        type: "order_picked_up",
        orderId: orderId.toString(),
        screen: "OrderDetails",
      },
    });

    await this.sendToUser(order.vendor, {
      title: "Order Picked Up! 📦",
      body: `Order #${orderId.slice(-6)} has been picked up by delivery partner`,
      data: {
        type: "order_picked_up",
        orderId: orderId.toString(),
        screen: "VendorOrderDetails",
      },
    });
  }

  async notifyOrderDelivered(orderId, order) {
    await this.sendToUser(order.customer, {
      title: "Order Delivered! 🎊",
      body: `Your order #${orderId.slice(-6)} has been delivered`,
      data: {
        type: "order_delivered",
        orderId: orderId.toString(),
        screen: "OrderDetails",
      },
    });

    await this.sendToUser(order.vendor, {
      title: "Order Completed! ✅",
      body: `Order #${orderId.slice(-6)} has been successfully delivered`,
      data: {
        type: "order_completed",
        orderId: orderId.toString(),
        screen: "VendorOrderDetails",
      },
    });

    if (order.deliveryPartner) {
      await this.sendToUser(order.deliveryPartner, {
        title: "Delivery Completed! 💰",
        body: `You've completed order #${orderId.slice(-6)}`,
        data: {
          type: "delivery_completed",
          orderId: orderId.toString(),
          screen: "DeliveryOrderDetails",
        },
      });
    }
  }

  async notifyOrderCancelled(orderId, order, reason) {
    await this.sendToUser(order.customer, {
      title: "Order Cancelled ❌",
      body: `Order #${orderId.slice(-6)} has been cancelled. ${reason}`,
      data: {
        type: "order_cancelled",
        orderId: orderId.toString(),
        screen: "Orders",
      },
    });

    if (order.deliveryPartner) {
      await this.sendToUser(order.deliveryPartner, {
        title: "Delivery Cancelled ❌",
        body: `Order #${orderId.slice(-6)} has been cancelled`,
        data: {
          type: "delivery_cancelled",
          orderId: orderId.toString(),
          screen: "DeliveryOrders",
        },
      });
    }
  }
}

module.exports = new NotificationService();