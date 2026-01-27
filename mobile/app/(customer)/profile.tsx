import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { storage, StorageKeys } from "../../utils/storage";

type MenuItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  route: string;
};

const menuItems: MenuItem[] = [
  {
    id: "1",
    icon: "person-outline",
    title: "Edit Profile",
    subtitle: "Update your personal information",
    route: "/(customer)/edit-profile",
  },
  {
    id: "2",
    icon: "location-outline",
    title: "Addresses",
    subtitle: "Manage your delivery addresses",
    route: "/(customer)/addresses",
  },
  {
    id: "3",
    icon: "heart-outline",
    title: "Favorites",
    subtitle: "Your saved items",
    route: "/(customer)/favorites",
  },
  {
    id: "4",
    icon: "wallet-outline",
    title: "Payment Methods",
    subtitle: "Manage your payment options",
    route: "/(customer)/payment-methods",
  },
  {
    id: "5",
    icon: "notifications-outline",
    title: "Notifications",
    subtitle: "Manage notification preferences",
    route: "/(customer)/notifications",
  },
  {
    id: "6",
    icon: "help-circle-outline",
    title: "Help & Support",
    subtitle: "Get help with your orders",
    route: "/(customer)/support",
  },
  {
    id: "7",
    icon: "shield-checkmark-outline",
    title: "Privacy Policy",
    subtitle: "Read our privacy policy",
    route: "/(customer)/privacy",
  },
  {
    id: "8",
    icon: "document-text-outline",
    title: "Terms & Conditions",
    subtitle: "Read our terms of service",
    route: "/(customer)/terms",
  },
];

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

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: 'Guest User',
    email: 'Not set',
    phone: 'Not set',
  });

  // Reload profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const savedProfile = await storage.getItem(StorageKeys.USER_PROFILE);
      if (savedProfile) {
        console.log('✅ Profile loaded:', savedProfile);
        setProfile(savedProfile);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            // Clear user data and navigate to login
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={50} color="#FFFFFF" />
          </View>
          
          <Text style={styles.userName}>{profile.name || 'Guest User'}</Text>
          <Text style={styles.userEmail}>{profile.email || 'Not set'}</Text>
          <Text style={styles.userPhone}>{profile.phone || 'Not set'}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
              </View>
              
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 100 }} />
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
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  menuSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.softPink,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.softPink,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.danger,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 24,
  },
});