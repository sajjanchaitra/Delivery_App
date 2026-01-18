import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Switch,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  route?: string;
  badge?: string;
  isToggle?: boolean;
  toggleValue?: boolean;
  color?: string;
};

export default function Profile() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // User data - Replace with actual user data from your auth context
  const user = {
    name: "John Doe",
    email: "johndoe@email.com",
    phone: "+91 98765 43210",
    avatar: null, // Can be a URL
    memberSince: "Jan 2024",
    totalOrders: 24,
    savedAddresses: 3,
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "My Account",
      items: [
        {
          id: "orders",
          icon: "receipt-outline",
          label: "My Orders",
          subtitle: `${user.totalOrders} orders`,
          route: "/(customer)/orders",
        },
        {
          id: "addresses",
          icon: "location-outline",
          label: "Saved Addresses",
          subtitle: `${user.savedAddresses} addresses`,
          route: "/(customer)/addresses",
        },
        {
          id: "payments",
          icon: "card-outline",
          label: "Payment Methods",
          subtitle: "Manage cards & UPI",
          route: "/(customer)/payments",
        },
        {
          id: "wishlist",
          icon: "heart-outline",
          label: "My Wishlist",
          badge: "12",
          route: "/(customer)/wishlist",
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
          isToggle: true,
          toggleValue: notificationsEnabled,
        },
        {
          id: "darkmode",
          icon: "moon-outline",
          label: "Dark Mode",
          isToggle: true,
          toggleValue: darkModeEnabled,
        },
        {
          id: "language",
          icon: "language-outline",
          label: "Language",
          subtitle: "English",
          route: "/(customer)/language",
        },
      ],
    },
    {
      title: "Support & About",
      items: [
        {
          id: "help",
          icon: "help-circle-outline",
          label: "Help Center",
          route: "/(customer)/help",
        },
        {
          id: "chat",
          icon: "chatbubble-outline",
          label: "Chat with Us",
          route: "/(customer)/chat",
        },
        {
          id: "about",
          icon: "information-circle-outline",
          label: "About App",
          subtitle: "Version 1.0.0",
        },
        {
          id: "rate",
          icon: "star-outline",
          label: "Rate the App",
        },
      ],
    },
    {
      title: "",
      items: [
        {
          id: "logout",
          icon: "log-out-outline",
          label: "Logout",
          color: "#EF4444",
        },
      ],
    },
  ];

  const handleToggle = (id: string) => {
    if (id === "notifications") {
      setNotificationsEnabled(!notificationsEnabled);
    } else if (id === "darkmode") {
      setDarkModeEnabled(!darkModeEnabled);
    }
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.isToggle) {
      handleToggle(item.id);
    } else if (item.id === "logout") {
      // Handle logout
      // router.replace("/(auth)/login");
    } else if (item.route) {
      // router.push(item.route);
    }
  };

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      activeOpacity={item.isToggle ? 1 : 0.7}
      onPress={() => handleMenuPress(item)}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuIconContainer,
            item.color && { backgroundColor: "#FEE2E2" },
          ]}
        >
          <Ionicons
            name={item.icon as any}
            size={20}
            color={item.color || "#64748B"}
          />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuLabel, item.color && { color: item.color }]}>
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>

      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {item.isToggle ? (
          <Switch
            value={item.id === "notifications" ? notificationsEnabled : darkModeEnabled}
            onValueChange={() => handleToggle(item.id)}
            trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
            thumbColor={
              (item.id === "notifications" ? notificationsEnabled : darkModeEnabled)
                ? "#22C55E"
                : "#94A3B8"
            }
          />
        ) : (
          !item.color && (
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          )
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={22} color="#4A90FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={["#4A90FF", "#357ABD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7}>
                <Ionicons name="camera" size={14} color="#4A90FF" />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.totalOrders}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.savedAddresses}</Text>
                <Text style={styles.statLabel}>Addresses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.memberSince}</Text>
                <Text style={styles.statLabel}>Member Since</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            <View style={styles.menuCard}>
              {section.items.map((item, index) =>
                renderMenuItem(item, index === section.items.length - 1)
              )}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ in India</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(customer)/home")}
        >
          <Ionicons name="home-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(customer)/orders")}
        >
          <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(customer)/cart")}
        >
          <Ionicons name="cart-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Cart</Text>
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
    backgroundColor: "#F8FBFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#4A90FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  profileGradient: {
    padding: 24,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: "#CBD5E1",
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