import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 60) / 3;

const allCategories = [
  // Main Categories
  { id: "1", name: "Grocery", icon: "cart", color: "#22C55E", bg: "#DCFCE7" },
  { id: "2", name: "Food", icon: "fast-food", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "3", name: "Pharmacy", icon: "medical", color: "#EF4444", bg: "#FEE2E2" },
  { id: "4", name: "Electronics", icon: "phone-portrait", color: "#3B82F6", bg: "#DBEAFE" },
  { id: "5", name: "Fashion", icon: "shirt", color: "#EC4899", bg: "#FCE7F3" },
  { id: "6", name: "Beauty", icon: "sparkles", color: "#8B5CF6", bg: "#EDE9FE" },
  // Additional Categories
  { id: "7", name: "Home & Living", icon: "home", color: "#06B6D4", bg: "#CFFAFE" },
  { id: "8", name: "Sports", icon: "football", color: "#14B8A6", bg: "#CCFBF1" },
  { id: "9", name: "Books", icon: "book", color: "#6366F1", bg: "#E0E7FF" },
  { id: "10", name: "Toys", icon: "game-controller", color: "#F43F5E", bg: "#FFE4E6" },
  { id: "11", name: "Pet Care", icon: "paw", color: "#84CC16", bg: "#ECFCCB" },
  { id: "12", name: "Baby Care", icon: "happy", color: "#FB923C", bg: "#FED7AA" },
  { id: "13", name: "Stationery", icon: "pencil", color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "14", name: "Beverages", icon: "wine", color: "#A855F7", bg: "#F3E8FF" },
  { id: "15", name: "Bakery", icon: "cafe", color: "#D97706", bg: "#FEF3C7" },
  { id: "16", name: "Dairy", icon: "water", color: "#0284C7", bg: "#E0F2FE" },
  { id: "17", name: "Meat & Fish", icon: "fish", color: "#DC2626", bg: "#FEE2E2" },
  { id: "18", name: "Fruits", icon: "nutrition", color: "#16A34A", bg: "#DCFCE7" },
];

const popularSearches = [
  "Milk",
  "Bread",
  "Eggs",
  "Rice",
  "Vegetables",
  "Chicken",
  "Snacks",
  "Juice",
];

export default function Categories() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FBFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Popular Searches */}
        {searchQuery.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.tagsContainer}>
              {popularSearches.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  activeOpacity={0.7}
                  onPress={() => setSearchQuery(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Featured Category Banner */}
        {searchQuery.length === 0 && (
          <TouchableOpacity style={styles.featuredBanner} activeOpacity={0.9}>
            <LinearGradient
              colors={["#4A90FF", "#357ABD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerLabel}>TODAY'S SPECIAL</Text>
                <Text style={styles.bannerTitle}>Fresh Groceries</Text>
                <Text style={styles.bannerSubtitle}>Up to 40% off on daily essentials</Text>
                <View style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4A90FF" />
                </View>
              </View>
              <View style={styles.bannerIcon}>
                <Ionicons name="cart" size={60} color="rgba(255,255,255,0.3)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* All Categories Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery.length > 0
              ? `Results for "${searchQuery}"`
              : "All Categories"}
          </Text>
          
          {filteredCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No categories found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching with a different term
              </Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.categoryIcon, { backgroundColor: category.bg }]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={28}
                      color={category.color}
                    />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  featuredBanner: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  bannerGradient: {
    flexDirection: "row",
    padding: 20,
    minHeight: 140,
  },
  bannerContent: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 14,
  },
  bannerButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90FF",
  },
  bannerIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: CARD_SIZE,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
});