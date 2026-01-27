import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

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

export default function VendorProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  const [user, setUser] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    memberSince: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("user");

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Load profile image from user data (check multiple fields for compatibility)
        const userImage = parsedUser.image || parsedUser.profileImage;
        if (userImage) {
          setProfileImage(userImage);
        }

        if (parsedUser.createdAt) {
          const date = new Date(parsedUser.createdAt);
          setStats((prev) => ({
            ...prev,
            memberSince: date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
          }));
        }
      }

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      // Fetch store data
      const storeResponse = await fetch(`${API_URL}/api/vendor/store`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const storeResult = await storeResponse.json();

      if (storeResult.hasStore && storeResult.store) {
        setStoreData(storeResult.store);
        
        // Load profile image from store (check multiple fields, overrides user data)
        const storeImage = storeResult.store.image || storeResult.store.logo || storeResult.store.profileImage;
        if (storeImage) {
          setProfileImage(storeImage);
        }
      }

      // Fetch dashboard for stats
      const dashResponse = await fetch(`${API_URL}/api/vendor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashResult = await dashResponse.json();

      if (dashResult.success && dashResult.stats) {
        setStats((prev) => ({
          ...prev,
          totalOrders: dashResult.stats.todayOrders || 0,
          totalProducts: dashResult.stats.totalProducts || 0,
        }));
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              "authToken",
              "user",
              "userId",
              "userPhone",
              "userRole",
              "isLoggedIn",
            ]);
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
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

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayName = (storeData && storeData.name) || (user && user.name) || "Vendor";
  const displayPhone = (user && user.phone) || "+91 XXXXXXXXXX";
  const displayEmail = (user && user.email) || "";
  const displayRating =
    (storeData &&
      storeData.rating &&
      storeData.rating.average &&
      storeData.rating.average.toFixed(1)) ||
    "0.0";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, "#B91C1C"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/(vendor)/store-setup")}
          >
            <Ionicons name="create-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {displayName.substring(0, 2).toUpperCase()}
                </Text>
              )}
            </View>

            {parseFloat(displayRating) > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.ratingText}>{displayRating}</Text>
              </View>
            )}
          </View>

          <Text style={styles.vendorName}>{displayName}</Text>
          <Text style={styles.vendorContact}>{displayPhone}</Text>

          {displayEmail ? <Text style={styles.vendorEmail}>{displayEmail}</Text> : null}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.memberSince || "N/A"}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route)}
              disabled={!item.route}
            >
              <View
                style={[
                  styles.menuIcon,
                  !item.route && styles.menuIconDisabled,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.route ? COLORS.primary : "#94A3B8"}
                />
              </View>

              <View style={styles.menuContent}>
                <Text
                  style={[
                    styles.menuLabel,
                    !item.route && styles.menuLabelDisabled,
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              {item.route ? (
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              ) : (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={22} color={COLORS.primary} />
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>
                Get notified for new orders
              </Text>
            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={notificationsEnabled ? COLORS.primary : "#FFF"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="checkmark-done" size={22} color={COLORS.primary} />
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Auto Accept Orders</Text>
              <Text style={styles.settingSubtitle}>
                Automatically accept incoming orders
              </Text>
            </View>

            <Switch
              value={autoAcceptOrders}
              onValueChange={setAutoAcceptOrders}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={autoAcceptOrders ? COLORS.primary : "#FFF"}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color={COLORS.danger} />
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
    backgroundColor: COLORS.bg,
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
    overflow: "hidden",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
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
  vendorEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
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
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
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
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.softPink,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconDisabled: {
    backgroundColor: COLORS.bg,
  },
  menuContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  menuLabelDisabled: {
    color: "#94A3B8",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D97706",
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.softPink,
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
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.softPink,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.danger,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 20,
  },
});