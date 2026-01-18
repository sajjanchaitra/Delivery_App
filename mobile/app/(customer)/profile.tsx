// app/(customer)/profile.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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

export default function ProfileScreen() {
  const router = useRouter();

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
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton} activeOpacity={0.7}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@email.com</Text>
          <Text style={styles.userPhone}>+91 98765 43210</Text>
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
                <Ionicons name={item.icon as any} size={24} color="#22C55E" />
              </View>
              
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#22C55E",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  editAvatarButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
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
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
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
    color: "#1E293B",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
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
});