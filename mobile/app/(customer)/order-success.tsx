// Create: app/(customer)/order-success.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const amount = params.amount as string;
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Success Header */}
      <View style={styles.successHeader}>
        <Animated.View 
          style={[
            styles.successIconContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
        </Animated.View>
        
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>
            Your order has been placed successfully
          </Text>
        </Animated.View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order ID</Text>
            <Text style={styles.orderValue}>{orderId}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Amount</Text>
            <Text style={styles.orderAmount}>₹{amount}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Estimated Delivery</Text>
            <Text style={styles.orderValue}>25-30 minutes</Text>
          </View>
        </View>

        {/* Delivery Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Order Timeline</Text>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotActive]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.timelineLine, styles.timelineLineActive]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>Order Placed</Text>
              <Text style={styles.timelineTime}>Just now</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotActive]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.timelineLine, styles.timelineLineActive]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>Order Confirmed</Text>
              <Text style={styles.timelineTime}>Processing</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View style={styles.timelineDotInner} />
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTextInactive}>Preparing</Text>
              <Text style={styles.timelineTimeInactive}>In 5 min</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View style={styles.timelineDotInner} />
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTextInactive}>Out for Delivery</Text>
              <Text style={styles.timelineTimeInactive}>In 15 min</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View style={styles.timelineDotInner} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTextInactive}>Delivered</Text>
              <Text style={styles.timelineTimeInactive}>In 25-30 min</Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Ionicons name="help-circle-outline" size={24} color="#64748B" />
          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpSubtitle}>
              Contact us for any queries about your order
            </Text>
          </View>
          <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={20} color="#22C55E" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.trackButton}
          activeOpacity={0.8}
          onPress={() => router.push({
            pathname: "/(customer)/order-details",
            params: { orderId }
          })}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Text style={styles.trackText}>Track Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.homeButton}
          activeOpacity={0.8}
          onPress={() => router.replace("/(customer)/home")}
        >
          <Ionicons name="home" size={20} color="#22C55E" />
          <Text style={styles.homeText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  successHeader: {
    backgroundColor: "#22C55E",
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  orderValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22C55E",
  },
  timelineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: "row",
    position: "relative",
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  timelineDotActive: {
    backgroundColor: "#22C55E",
  },
  timelineDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
  },
  timelineLine: {
    position: "absolute",
    left: 15,
    top: 32,
    width: 2,
    height: 40,
    backgroundColor: "#E2E8F0",
  },
  timelineLineActive: {
    backgroundColor: "#22C55E",
  },
  timelineContent: {
    marginLeft: 16,
    marginBottom: 24,
  },
  timelineText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  timelineTextInactive: {
    fontSize: 15,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 13,
    color: "#22C55E",
  },
  timelineTimeInactive: {
    fontSize: 13,
    color: "#CBD5E1",
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  trackButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  trackText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  homeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  homeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#22C55E",
  },
});