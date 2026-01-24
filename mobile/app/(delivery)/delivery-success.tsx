// app/(delivery)/delivery-success.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DeliverySuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
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
          <Ionicons name="checkmark-circle" size={100} color="#FFFFFF" />
        </Animated.View>
        
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.successTitle}>Delivery Completed!</Text>
          <Text style={styles.successSubtitle}>
            Great job! Your earnings have been updated
          </Text>
        </Animated.View>
      </View>

      <View style={styles.content}>
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>You Earned</Text>
          <Text style={styles.earningsValue}>₹{params.earnings || 0}</Text>
          <View style={styles.earningsBadge}>
            <Ionicons name="trending-up" size={16} color="#22C55E" />
            <Text style={styles.earningsBadgeText}>Added to wallet</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{params.orderId || "N/A"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Time</Text>
            <Text style={styles.detailValue}>Just now</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={[styles.detailValue, { color: "#22C55E" }]}>Received</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => router.replace("/(delivery)/home" as any)}
        >
          <Ionicons name="home" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Keep up the good work! Complete more deliveries to earn more
          </Text>
        </View>
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
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
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
  content: {
    flex: 1,
    padding: 20,
  },
  earningsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  earningsLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 42,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 12,
  },
  earningsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  earningsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
});