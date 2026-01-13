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
  FlatList,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;

// Dummy data - Replace with API data
const categories = [
  { id: "1", name: "Grocery", icon: "cart", color: "#22C55E", bg: "#DCFCE7" },
  { id: "2", name: "Food", icon: "fast-food", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "3", name: "Pharmacy", icon: "medical", color: "#EF4444", bg: "#FEE2E2" },
  { id: "4", name: "Electronics", icon: "phone-portrait", color: "#3B82F6", bg: "#DBEAFE" },
  { id: "5", name: "Fashion", icon: "shirt", color: "#EC4899", bg: "#FCE7F3" },
  { id: "6", name: "More", icon: "grid", color: "#64748B", bg: "#F1F5F9" },
];

const promotions = [
  {
    id: "1",
    title: "50% OFF",
    subtitle: "On your first order",
    code: "WELCOME50",
    gradient: ["#4A90FF", "#357ABD"],
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200",
  },
  {
    id: "2",
    title: "Free Delivery",
    subtitle: "Orders above ₹299",
    code: "FREEDEL",
    gradient: ["#22C55E", "#16A34A"],
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=200",
  },
  {
    id: "3",
    title: "20% Cashback",
    subtitle: "Pay with UPI",
    code: "UPI20",
    gradient: ["#F59E0B", "#D97706"],
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200",
  },
];

const featuredProducts = [
  {
    id: "1",
    name: "Fresh Vegetables Bundle",
    price: 149,
    originalPrice: 199,
    rating: 4.5,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300",
    discount: "25% OFF",
  },
  {
    id: "2",
    name: "Organic Fruits Basket",
    price: 299,
    originalPrice: 399,
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300",
    discount: "25% OFF",
  },
  {
    id: "3",
    name: "Daily Essentials Pack",
    price: 499,
    originalPrice: 649,
    rating: 4.3,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300",
    discount: "23% OFF",
  },
  {
    id: "4",
    name: "Premium Rice 5kg",
    price: 349,
    originalPrice: 449,
    rating: 4.6,
    reviews: 412,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",
    discount: "22% OFF",
  },
];

const nearbyStores = [
  {
    id: "1",
    name: "FreshMart Superstore",
    category: "Grocery",
    rating: 4.7,
    time: "15-20 min",
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300",
  },
  {
    id: "2",
    name: "QuickBite Restaurant",
    category: "Food",
    rating: 4.5,
    time: "25-30 min",
    distance: "2.1 km",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300",
  },
  {
    id: "3",
    name: "HealthPlus Pharmacy",
    category: "Pharmacy",
    rating: 4.8,
    time: "10-15 min",
    distance: "0.8 km",
    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300",
  },
];

export default function CustomerHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity style={styles.categoryItem} activeOpacity={0.7}>
      <View style={[styles.categoryIcon, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPromotionItem = ({ item }: { item: typeof promotions[0] }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.promotionCard}>
      <LinearGradient
        colors={item.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promotionGradient}
      >
        <View style={styles.promotionContent}>
          <Text style={styles.promotionTitle}>{item.title}</Text>
          <Text style={styles.promotionSubtitle}>{item.subtitle}</Text>
          <View style={styles.promoCodeContainer}>
            <Text style={styles.promoCode}>{item.code}</Text>
          </View>
        </View>
        <View style={styles.promotionImageContainer}>
          <View style={styles.promotionCircle} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: typeof featuredProducts[0] }) => (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.8}>
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
        <TouchableOpacity style={styles.wishlistButton} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews})</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStoreItem = ({ item }: { item: typeof nearbyStores[0] }) => (
    <TouchableOpacity style={styles.storeCard} activeOpacity={0.8}>
      <Image source={{ uri: item.image }} style={styles.storeImage} />
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.storeCategory}>{item.category}</Text>
        <View style={styles.storeMetaContainer}>
          <View style={styles.storeMeta}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.storeMetaText}>{item.rating}</Text>
          </View>
          <View style={styles.storeMeta}>
            <Ionicons name="time-outline" size={12} color="#64748B" />
            <Text style={styles.storeMetaText}>{item.time}</Text>
          </View>
          <View style={styles.storeMeta}>
            <Ionicons name="location-outline" size={12} color="#64748B" />
            <Text style={styles.storeMetaText}>{item.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FBFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationContainer}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={18} color="#4A90FF" />
            </View>
            <View>
              <Text style={styles.deliveryLabel}>Deliver to</Text>
              <TouchableOpacity style={styles.locationSelector} activeOpacity={0.7}>
                <Text style={styles.locationText}>Home - Bengaluru</Text>
                <Ionicons name="chevron-down" size={16} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={24} color="#334155" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7}>
              <LinearGradient
                colors={["#4A90FF", "#357ABD"]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>JD</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, stores..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color="#4A90FF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Promotions Carousel */}
        <FlatList
          data={promotions}
          renderItem={renderPromotionItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promotionList}
          snapToInterval={width - 48}
          decelerationRate="fast"
        />

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            numColumns={6}
            scrollEnabled={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
          />
        </View>

        {/* Nearby Stores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Stores</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {nearbyStores.map((store) => (
            <View key={store.id}>{renderStoreItem({ item: store })}</View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <View style={styles.navItemActive}>
            <Ionicons name="home" size={22} color="#4A90FF" />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="grid-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}           onPress={() => router.push("../(customer)/categories")}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCart} activeOpacity={0.8}>
          <LinearGradient
            colors={["#4A90FF", "#357ABD"]}
            style={styles.cartButton}
          >
            <Ionicons name="cart" size={24} color="#FFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="receipt-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="person-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
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
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  avatarButton: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    marginLeft: 10,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  promotionList: {
    paddingHorizontal: 20,
  },
  promotionCard: {
    width: width - 56,
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  promotionGradient: {
    flexDirection: "row",
    padding: 20,
    height: 140,
  },
  promotionContent: {
    flex: 1,
    justifyContent: "center",
  },
  promotionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  promotionSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
  },
  promoCodeContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
  },
  promoCode: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 1,
  },
  promotionImageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  promotionCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90FF",
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
  },
  productList: {
    paddingHorizontal: 20,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginRight: 12,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  productImageContainer: {
    position: "relative",
    height: 130,
    backgroundColor: "#F8FAFC",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 11,
    color: "#94A3B8",
    marginLeft: 2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  originalPrice: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  addButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#4A90FF",
    justifyContent: "center",
    alignItems: "center",
  },
  storeCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  storeInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  storeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  storeCategory: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  storeMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeMetaText: {
    fontSize: 12,
    color: "#64748B",
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
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navItemActive: {
    backgroundColor: "#F0F7FF",
    padding: 8,
    borderRadius: 12,
    marginBottom: -4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94A3B8",
  },
  navLabelActive: {
    color: "#4A90FF",
    fontWeight: "600",
  },
  navItemCart: {
    marginTop: -30,
  },
  cartButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A90FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
});