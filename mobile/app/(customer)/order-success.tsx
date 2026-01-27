// app/(customer)/order-success.tsx
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
  const orderNumber = params.orderNumber as string;
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
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* Success Header */}
      <View style={styles.successHeader}>
        <Animated.View style={[styles.successIconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>Your order has been placed successfully</Text>
        </Animated.View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order ID</Text>
            <Text style={styles.orderValue}>{orderNumber || orderId}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Amount</Text>
            <Text style={styles.orderAmount}>₹{amount}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Estimated Delivery</Text>
            <Text style={styles.orderValue}>30-45 minutes</Text>
          </View>
        </View>

        {/* What's Next Card */}
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>What happens next?</Text>

          <View style={styles.nextItem}>
            <View style={[styles.nextIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
            </View>
            <View style={styles.nextContent}>
              <Text style={styles.nextItemTitle}>Order Confirmed</Text>
              <Text style={styles.nextItemText}>We've received your order</Text>
            </View>
          </View>

          <View style={styles.nextItem}>
            <View style={[styles.nextIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="restaurant" size={20} color="#F59E0B" />
            </View>
            <View style={styles.nextContent}>
              <Text style={styles.nextItemTitle}>Preparing Your Order</Text>
              <Text style={styles.nextItemText}>The store will start preparing soon</Text>
            </View>
          </View>

          <View style={styles.nextItem}>
            <View style={[styles.nextIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="bicycle" size={20} color="#DC2626" />
            </View>
            <View style={styles.nextContent}>
              <Text style={styles.nextItemTitle}>Out for Delivery</Text>
              <Text style={styles.nextItemText}>A delivery partner will pick it up</Text>
            </View>
          </View>

          <View style={styles.nextItem}>
            <View style={[styles.nextIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="home" size={20} color="#DC2626" />
            </View>
            <View style={styles.nextContent}>
              <Text style={styles.nextItemTitle}>Delivered</Text>
              <Text style={styles.nextItemText}>Enjoy your order!</Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Ionicons name="help-circle-outline" size={24} color="#64748B" />
          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpSubtitle}>Contact us for any queries about your order</Text>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() =>
            router.replace({
              pathname: "/(customer)/order-details",
              params: { orderId },
            } as any)
          }
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Text style={styles.trackText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace("/(customer)/home" as any)}>
          <Ionicons name="home" size={20} color="#DC2626" />
          <Text style={styles.homeText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  successHeader: { backgroundColor: "#DC2626", paddingTop: 60, paddingBottom: 40, alignItems: "center" },
  successIconContainer: { marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.9)", textAlign: "center" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  orderCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  orderLabel: { fontSize: 14, color: "#64748B" },
  orderValue: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  orderAmount: { fontSize: 20, fontWeight: "700", color: "#DC2626" },
  nextCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, marginBottom: 16 },
  nextTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  nextItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  nextIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  nextContent: { flex: 1 },
  nextItemTitle: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 2 },
  nextItemText: { fontSize: 13, color: "#94A3B8" },
  helpCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, gap: 12 },
  helpText: { flex: 1 },
  helpTitle: { fontSize: 15, fontWeight: "600", color: "#1E293B", marginBottom: 2 },
  helpSubtitle: { fontSize: 13, color: "#94A3B8" },
  helpButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 12 },
  trackButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#DC2626", borderRadius: 12, paddingVertical: 14, gap: 8 },
  trackText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  homeButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FEE2E2", borderRadius: 12, paddingVertical: 14, gap: 8, borderWidth: 1, borderColor: "#FCA5A5" },
  homeText: { fontSize: 15, fontWeight: "600", color: "#DC2626" },
});