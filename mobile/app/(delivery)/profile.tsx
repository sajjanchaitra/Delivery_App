// Create: app/(delivery)/profile.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Switch,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  action?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
};

export default function DeliveryProfile() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Driver stats
  const stats = {
    totalDeliveries: 1248,
    rating: 4.8,
    onTimeRate: 96,
    memberSince: "Jan 2023",
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            // Handle logout logic
            router.replace("/(auth)/login");
          }
        }
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Account",
      items: [
        {
          id: "personal-info",
          icon: "person-outline",
          label: "Personal Information",
          route: "/(delivery)/personal-info",
          showArrow: true,
        },
        {
          id: "vehicle-info",
          icon: "bicycle-outline",
          label: "Vehicle Information",
          route: "/(delivery)/vehicle-info",
          showArrow: true,
        },
        {
          id: "documents",
          icon: "document-text-outline",
          label: "Documents",
          route: "/(delivery)/documents",
          showArrow: true,
        },
        {
          id: "bank-details",
          icon: "card-outline",
          label: "Bank Details",
          route: "/(delivery)/bank-details",
          showArrow: true,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          icon: "notifications-outline",
          label: "Notifications",
          showArrow: false,
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
              thumbColor={notificationsEnabled ? "#22C55E" : "#F1F5F9"}
            />
          ),
        },
        {
          id: "location",
          icon: "location-outline",
          label: "Location Services",
          showArrow: false,
          rightComponent: (
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
              thumbColor={locationEnabled ? "#22C55E" : "#F1F5F9"}
            />
          ),
        },
        {
          id: "language",
          icon: "language-outline",
          label: "Language",
          route: "/(delivery)/language",
          showArrow: true,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          icon: "help-circle-outline",
          label: "Help Center",
          route: "/(delivery)/help",
          showArrow: true,
        },
        {
          id: "safety",
          icon: "shield-checkmark-outline",
          label: "Safety",
          route: "/(delivery)/safety",
          showArrow: true,
        },
        {
          id: "feedback",
          icon: "chatbox-outline",
          label: "Send Feedback",
          route: "/(delivery)/feedback",
          showArrow: true,
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          id: "terms",
          icon: "document-outline",
          label: "Terms & Conditions",
          route: "/(delivery)/terms",
          showArrow: true,
        },
        {
          id: "privacy",
          icon: "lock-closed-outline",
          label: "Privacy Policy",
          route: "/(delivery)/privacy",
          showArrow: true,
        },
      ],
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) {
      router.push(item.route as any);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/edit-profile" as any)}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#22C55E" />
            </View>
            <TouchableOpacity 
              style={styles.avatarEditButton}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.driverName}>Rajesh Kumar</Text>
          <Text style={styles.driverId}>ID: DRV-12345</Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.ratingRow}>
                <Text style={styles.statValue}>{stats.rating}</Text>
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.onTimeRate}%</Text>
              <Text style={styles.statLabel}>On-Time</Text>
            </View>
          </View>

          <View style={styles.memberSince}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.memberText}>Member since {stats.memberSince}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.7}
                    onPress={() => handleMenuPress(item)}
                    disabled={!item.route && !item.action}
                  >
                    <View style={styles.menuLeft}>
                      <View style={styles.menuIcon}>
                        <Ionicons name={item.icon} size={22} color="#1E293B" />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    {item.rightComponent || (
                      item.showArrow && (
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                      )
                    )}
                  </TouchableOpacity>
                  {index < section.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/home")}
        >
          <Ionicons name="home-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/orders")}
        >
          <Ionicons name="list-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/earnings")}
        >
          <Ionicons name="wallet-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="person" size={24} color="#22C55E" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
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
  header: {
    backgroundColor: "#1E293B",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#22C55E",
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  driverName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  driverId: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F1F5F9",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  memberSince: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberText: {
    fontSize: 13,
    color: "#64748B",
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  versionText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 24,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  navLabelActive: {
    color: "#22C55E",
    fontWeight: "600",
  },
});