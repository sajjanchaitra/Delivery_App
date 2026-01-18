import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const SHOP_CARD_WIDTH = (width - 52) / 2;

// Dummy data - Replace with API data
const categories = [
  {
    id: "1",
    name: "Grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200",
  },
  {
    id: "2",
    name: "Food",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200",
  },
  {
    id: "3",
    name: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200",
  },
  {
    id: "4",
    name: "Dairy",
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200",
  },
];

const nearbyShops = [
  {
    id: "1",
    name: "Westside Market",
    distance: "1.0 km",
    rating: 4.8,
    reviews: "reviews",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300",
  },
  {
    id: "2",
    name: "Green Mart",
    distance: "500 m",
    rating: 4.6,
    reviews: "reviews",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
  },
  {
    id: "3",
    name: "Fresh Basket",
    distance: "1.2 km",
    rating: 4.5,
    reviews: "reviews",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300",
  },
  {
    id: "4",
    name: "Daily Needs",
    distance: "800 m",
    rating: 4.7,
    reviews: "reviews",
    image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=300",
  },
];

export default function CustomerHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header / Location */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={20} color="#22C55E" />
            </View>
            <View style={styles.locationInfo}>
              <TouchableOpacity style={styles.locationSelector} activeOpacity={0.7}>
                <Text style={styles.locationLabel}>Current location</Text>
                <Ionicons name="chevron-down" size={14} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.locationAddress} numberOfLines={1}>
                New mico layout, Kudlu...
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.qrButton} activeOpacity={0.7}>
            <Ionicons name="qr-code-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Groceries, Shops or etc"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Promotion Banner */}
        <TouchableOpacity style={styles.promoBanner} activeOpacity={0.9}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>
              Claim your{"\n"}discount 30%{"\n"}daily now!
            </Text>
            <TouchableOpacity style={styles.promoButton} activeOpacity={0.8}>
              <Text style={styles.promoButtonText}>Order now</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300",
            }}
            style={styles.promoImage}
          />
          {/* Pagination dots */}
          <View style={styles.promoDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </TouchableOpacity>

        {/* Top Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                activeOpacity={0.7}
                onPress={() => router.push("/(customer)/categories")}
              >
                <View style={styles.categoryImageContainer}>
                  <Image
                    source={{ uri: category.image }}
                    style={styles.categoryImage}
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Shops Near You */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shops Near You</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.shopsGrid}>
            {nearbyShops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={styles.shopCard}
                activeOpacity={0.8}
              >
                <Image source={{ uri: shop.image }} style={styles.shopImage} />
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <View style={styles.shopMeta}>
                    <Text style={styles.shopDistance}>{shop.distance}</Text>
                    <Text style={styles.shopDot}>•</Text>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.shopRating}>{shop.rating}</Text>
                    <Text style={styles.shopReviews}>{shop.reviews}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color="#22C55E" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
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

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(customer)/profile")}
        >
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationIcon: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 2,
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    marginLeft: 10,
  },
  filterButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  promoBanner: {
    backgroundColor: "#22C55E",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    overflow: "hidden",
    minHeight: 140,
  },
  promoContent: {
    flex: 1,
    zIndex: 1,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 24,
    marginBottom: 12,
  },
  promoButton: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  promoImage: {
    width: 140,
    height: 160,
    position: "absolute",
    right: -10,
    bottom: -20,
    resizeMode: "contain",
  },
  promoDots: {
    position: "absolute",
    bottom: 12,
    right: 16,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
  },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  categoryItem: {
    alignItems: "center",
  },
  categoryImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1E293B",
  },
  shopsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  shopCard: {
    width: SHOP_CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  shopImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderRadius: 12,
  },
  shopInfo: {
    paddingVertical: 10,
  },
  shopName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  shopMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopDistance: {
    fontSize: 12,
    color: "#64748B",
  },
  shopDot: {
    fontSize: 12,
    color: "#CBD5E1",
    marginHorizontal: 6,
  },
  shopRating: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 2,
  },
  shopReviews: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
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