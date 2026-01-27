// app/(vendor)/store-setup/index.jsx
// Store Type Selection Screen

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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

const storeTypes = [
  {
    id: "medical",
    name: "Medical Store",
    subtitle: "Pharmacy & Healthcare",
    description: "Medicines, health products, medical equipment",
    icon: "medical",
    color: COLORS.primary,
    bgColor: COLORS.softPink,
    gradient: [COLORS.primary, "#B91C1C"],
    features: [
      "Prescription management",
      "Medicine inventory with expiry tracking",
      "Drug license verification",
      "Batch & HSN code support",
      "Controlled substance tracking",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    subtitle: "Food & Beverages",
    description: "Ready to eat food, meals, beverages",
    icon: "restaurant",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    gradient: ["#F59E0B", "#D97706"],
    features: [
      "Menu management with categories",
      "Preparation time settings",
      "Cuisine type selection",
      "Veg/Non-veg marking",
      "Add-ons & customizations",
    ],
  },
  {
    id: "general",
    name: "General Store",
    subtitle: "Grocery & Daily Needs",
    description: "Grocery, vegetables, fruits, dairy, daily essentials",
    icon: "storefront",
    color: COLORS.success,
    bgColor: "#DCFCE7",
    gradient: [COLORS.success, "#16A34A"],
    features: [
      "Multiple product categories",
      "Weight/quantity variants",
      "Stock management",
      "Bulk product upload",
      "Price & discount management",
    ],
  },
];

export default function StoreTypeSelection() {
  const router = useRouter();

  const handleSelectType = (storeType) => {
    router.push({
      pathname: `/(vendor)/store-setup/${storeType.id}`,
      params: { storeType: storeType.id, storeName: storeType.name },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.text} />

      {/* Header */}
      <LinearGradient colors={[COLORS.text, "#334155"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{"Setup Your Store"}</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>
          {"Choose your business type to get started"}
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>{"Select your business type"}</Text>
            <Text style={styles.infoText}>
              {"Each type has specific features tailored for your business needs. You can change this later."}
            </Text>
          </View>
        </View>

        {/* Store Type Cards */}
        {storeTypes.map((type, index) => (
          <TouchableOpacity
            key={type.id}
            style={styles.storeCard}
            activeOpacity={0.7}
            onPress={() => handleSelectType(type)}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={type.gradient}
                style={styles.iconContainer}
              >
                <Ionicons name={type.icon} size={28} color="#FFF" />
              </LinearGradient>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{type.name}</Text>
                <Text style={styles.cardSubtitle}>{type.subtitle}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
              </View>
            </View>

            {/* Description */}
            <Text style={styles.cardDescription}>{type.description}</Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>{"Key Features:"}</Text>
              {type.features.slice(0, 3).map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={type.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {type.features.length > 3 && (
                <Text style={[styles.moreFeatures, { color: type.color }]}>
                  {`+${type.features.length - 3} more features`}
                </Text>
              )}
            </View>

            {/* Select Button */}
            <LinearGradient
              colors={type.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>{"Select & Continue"}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: { 
    paddingTop: 50, 
    paddingBottom: 24, 
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: "rgba(255,255,255,0.15)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  placeholder: { width: 44 },

  content: { flex: 1 },
  scrollContent: { padding: 20 },

  infoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.softBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoIconContainer: { marginRight: 12 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: "600", color: "#1E40AF", marginBottom: 4 },
  infoText: { fontSize: 13, color: "#3B82F6", lineHeight: 18 },

  storeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleContainer: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  cardSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  arrowContainer: { padding: 4 },

  cardDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },

  featuresContainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textLight,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },

  bottomSpacer: { height: 40 },
});