import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function VendorProfile() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  const vendor = {
    name: "Fresh Mart Store",
    phone: "+91 98765 43210",
    email: "freshmart@email.com",
    rating: 4.8,
    totalOrders: 156,
    totalProducts: 48,
    memberSince: "Jan 2024",
  };

  const menuItems = [
    {
      id: "store",
      icon: "storefront",
      label: "Store Settings",
      subtitle: "Edit store details, hours & delivery",
      route: "/(vendor)/store-setup",
    },
    {
      id: "products",
      icon: "cube",
      label: "My Products",
      subtitle: "Manage your product listings",
      route: "/(vendor)/products",
    },
    {
      id: "orders",
      icon: "receipt",
      label: "Order History",
      subtitle: "View all past orders",
      route: "/(vendor)/orders",
    },
    {
      id: "earnings",
      icon: "wallet",
      label: "Earnings",
      subtitle: "View your earnings & payouts",
      route: null,
    },
    {
      id: "analytics",
      icon: "analytics",
      label: "Analytics",
      subtitle: "View sales & performance stats",
      route: null,
    },
  ];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/(auth)/login"),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="storefront" size={36} color="#22C55E" />
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFF" />
              <Text style={styles.ratingText}>{vendor.rating}</Text>
            </View>
          </View>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <Text style={styles.vendorContact}>{vendor.phone}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vendor.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vendor.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vendor.memberSince}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route)}
              disabled={!item.route}
            >
              <View style={[styles.menuIcon, !item.route && styles.menuIconDisabled]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.route ? "#22C55E" : "#94A3B8"}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, !item.route && styles.menuLabelDisabled]}>
                  {item.label}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={item.route ? "#94A3B8" : "#E2E8F0"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={22} color="#22C55E" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>Get notified for new orders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
              thumbColor={notificationsEnabled ? "#22C55E" : "#FFF"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="checkmark-done" size={22} color="#22C55E" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Auto Accept Orders</Text>
              <Text style={styles.settingSubtitle}>Automatically accept incoming orders</Text>
            </View>
            <Switch
              value={autoAcceptOrders}
              onValueChange={setAutoAcceptOrders}
              trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
              thumbColor={autoAcceptOrders ? "#22C55E" : "#FFF"}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.supportItem}>
            <View style={styles.supportIcon}>
              <Ionicons name="help-circle" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.supportLabel}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <View style={styles.supportIcon}>
              <Ionicons name="chatbubbles" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.supportLabel}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <View style={styles.supportIcon}>
              <Ionicons name="document-text" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.supportLabel}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  vendorName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
  },
  vendorContact: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuSection: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconDisabled: {
    backgroundColor: "#F8FAFC",
  },
  menuContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  menuLabelDisabled: {
    color: "#94A3B8",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: 14,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  supportSection: {
    marginBottom: 20,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  supportLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 20,
  },
});