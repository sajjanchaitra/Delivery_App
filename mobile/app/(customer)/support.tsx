import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
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

type SupportOption = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
};

export default function Support() {
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL("tel:+911234567890");
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@yourapp.com");
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/911234567890");
  };

  const handleFAQ = () => {
    // Navigate to FAQ screen or open FAQ page
    console.log("Open FAQ");
  };

  const supportOptions: SupportOption[] = [
    {
      id: "1",
      icon: "call",
      title: "Call Us",
      subtitle: "+91 123 456 7890",
      action: handleCall,
    },
    {
      id: "2",
      icon: "mail",
      title: "Email Us",
      subtitle: "support@yourapp.com",
      action: handleEmail,
    },
    {
      id: "3",
      icon: "logo-whatsapp",
      title: "WhatsApp",
      subtitle: "Chat with us on WhatsApp",
      action: handleWhatsApp,
    },
    {
      id: "4",
      icon: "help-circle",
      title: "FAQ",
      subtitle: "Find answers to common questions",
      action: handleFAQ,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="headset" size={48} color={COLORS.primary} />
          <Text style={styles.bannerTitle}>We're Here to Help</Text>
          <Text style={styles.bannerSubtitle}>
            Get in touch with us anytime. Our support team is ready to assist you.
          </Text>
        </View>

        {/* Support Options */}
        <View style={styles.optionsSection}>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                index === supportOptions.length - 1 && styles.optionCardLast
              ]}
              activeOpacity={0.7}
              onPress={option.action}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={option.icon as any} size={24} color={COLORS.primary} />
              </View>
              
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
            </TouchableOpacity>
          ))}
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
  infoBanner: {
    backgroundColor: COLORS.softPink,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
  optionsSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionCardLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.softPink,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  hoursSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  hoursCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "500",
  },
});