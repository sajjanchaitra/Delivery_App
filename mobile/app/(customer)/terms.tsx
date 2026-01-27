import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#DC2626",
  secondary: "#F87171",
  danger: "#DC2626",
  success: "#22C55E",
  
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  border: "#E2E8F0",
  
  softBlue: "#EFF6FF",
  softPink: "#FEE2E2",
};

export default function Terms() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Last Updated */}
        <View style={styles.updateBanner}>
          <Ionicons name="time-outline" size={20} color={COLORS.primary} />
          <Text style={styles.updateText}>Last updated: January 2026</Text>
        </View>

        {/* Terms Content */}
        <View style={styles.contentCard}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By accessing and using this app, you accept and agree to be bound by the terms 
              and conditions of this agreement. If you do not agree to these terms, please do 
              not use our services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Account Registration</Text>
            <Text style={styles.sectionText}>
              You must create an account to use certain features of our service. You are 
              responsible for maintaining the confidentiality of your account credentials and 
              for all activities under your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Orders and Payments</Text>
            <Text style={styles.sectionText}>
              All orders are subject to availability and acceptance. We reserve the right to 
              refuse or cancel any order. Payment must be made at the time of placing the order 
              through our accepted payment methods.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Delivery</Text>
            <Text style={styles.sectionText}>
              We strive to deliver orders within the estimated time frame. However, delivery 
              times are approximate and may vary due to factors beyond our control.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Cancellation and Refunds</Text>
            <Text style={styles.sectionText}>
              Orders may be cancelled within a specified time frame. Refunds will be processed 
              according to our refund policy. Please contact customer support for cancellation 
              requests.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. User Conduct</Text>
            <Text style={styles.sectionText}>
              You agree not to use our services for any unlawful purpose or in any way that 
              could damage, disable, or impair our services. You must not engage in fraudulent 
              activities.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
            <Text style={styles.sectionText}>
              All content, trademarks, and logos on this app are the property of our company 
              or our partners. You may not use, reproduce, or distribute any content without 
              our permission.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              We are not liable for any indirect, incidental, or consequential damages arising 
              from your use of our services. Our liability is limited to the amount you paid 
              for the service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We reserve the right to modify these terms at any time. Continued use of our 
              services after changes constitutes acceptance of the modified terms.
            </Text>
          </View>

          <View style={[styles.section, { borderBottomWidth: 0 }]}>
            <Text style={styles.sectionTitle}>10. Contact Information</Text>
            <Text style={styles.sectionText}>
              For any questions regarding these terms and conditions, please contact us at 
              legal@yourapp.com
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  updateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.softPink,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  updateText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
  contentCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
});