            // Create: app/(delivery)/orders.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Order = {
  id: string;
  orderId: string;
  customerName: string;
  storeName: string;
  distance: string;
  amount: number;
  earnings: number;
  status: "new" | "accepted" | "picked" | "delivering";
  pickupAddress: string;
  deliveryAddress: string;
  items: number;
};

const ordersData: Order[] = [
  {
    id: "1",
    orderId: "ORD12345",
    customerName: "John Doe",
    storeName: "Westside Market",
    distance: "2.5 km",
    amount: 1299,
    earnings: 130,
    status: "new",
    pickupAddress: "Westside Market, MG Road, Bangalore",
    deliveryAddress: "New mico layout, Kudlu, Bangalore - 560068",
    items: 3,
  },
  {
    id: "2",
    orderId: "ORD12346",
    customerName: "Jane Smith",
    storeName: "Green Mart",
    distance: "1.8 km",
    amount: 899,
    earnings: 90,
    status: "new",
    pickupAddress: "Green Mart, HSR Layout",
    deliveryAddress: "Koramangala 5th Block, Bangalore",
    items: 5,
  },
  {
    id: "3",
    orderId: "ORD12347",
    customerName: "Mike Johnson",
    storeName: "Fresh Basket",
    distance: "3.2 km",
    amount: 549,
    earnings: 55,
    status: "new",
    pickupAddress: "Fresh Basket, Indiranagar",
    deliveryAddress: "Whitefield Main Road, Bangalore",
    items: 2,
  },
  {
    id: "4",
    orderId: "ORD12348",
    customerName: "Sarah Williams",
    storeName: "Daily Needs",
    distance: "1.5 km",
    amount: 799,
    earnings: 80,
    status: "new",
    pickupAddress: "Daily Needs, BTM Layout",
    deliveryAddress: "Jayanagar 4th Block, Bangalore",
    items: 4,
  },
];

const tabs = ["Available", "Accepted", "Completed"];

export default function DeliveryOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Available");
  const [orders] = useState<Order[]>(ordersData);

  const getFilteredOrders = () => {
    if (activeTab === "Available") {
      return orders.filter(o => o.status === "new");
    }
    if (activeTab === "Accepted") {
      return orders.filter(o => ["accepted", "picked", "delivering"].includes(o.status));
    }
    return [];
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => router.push({
        pathname: "/(delivery)/order-details",
        params: { orderId: item.orderId }
      })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={styles.storeName}>{item.storeName}</Text>
        </View>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Earn</Text>
          <Text style={styles.earningsValue}>₹{item.earnings}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: "#22C55E" }]} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Pickup from</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: "#EF4444" }]} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Deliver to</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={16} color="#64748B" />
          <Text style={styles.metaText}>{item.distance}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="bag-handle" size={16} color="#64748B" />
          <Text style={styles.metaText}>{item.items} items</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cash" size={16} color="#64748B" />
          <Text style={styles.metaText}>₹{item.amount}</Text>
        </View>
      </View>

      {activeTab === "Available" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.rejectButton} activeOpacity={0.7}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} activeOpacity={0.7}>
            <Text style={styles.acceptText}>Accept Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={getFilteredOrders()}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders available</Text>
            <Text style={styles.emptyText}>
              {activeTab === "Available" 
                ? "New orders will appear here"
                : "You haven't accepted any orders yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
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
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: "#22C55E",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#22C55E",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  storeName: {
    fontSize: 13,
    color: "#64748B",
  },
  earningsBox: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  earningsLabel: {
    fontSize: 10,
    color: "#16A34A",
    marginBottom: 2,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E2E8F0",
    marginLeft: 5,
    marginVertical: 4,
  },
  orderMeta: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    alignItems: "center",
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});