// Create: app/(customer)/addresses.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Address = {
  id: string;
  label: string;
  address: string;
  landmark: string;
  isDefault: boolean;
};

const initialAddresses: Address[] = [
  {
    id: "1",
    label: "Home",
    address: "New mico layout, Kudlu, Bangalore - 560068",
    landmark: "Near Metro Station",
    isDefault: true,
  },
  {
    id: "2",
    label: "Office",
    address: "HSR Layout, Sector 2, Bangalore - 560102",
    landmark: "Opposite to Coffee Shop",
    isDefault: false,
  },
];

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAddresses(addresses.filter(addr => addr.id !== id));
          }
        }
      ]
    );
  };

  const handleEdit = (address: Address) => {
    router.push({
      pathname: "../add-address",
      params: {
        mode: "edit",
        addressId: address.id,
        label: address.label,
        address: address.address,
        landmark: address.landmark,
      }
    });
  };

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
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add New Address Button */}
        <TouchableOpacity 
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => router.push("../add-address")}
        >
          <View style={styles.addIconContainer}>
            <Ionicons name="add" size={24} color="#22C55E" />
          </View>
          <Text style={styles.addButtonText}>Add New Address</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Saved Addresses */}
        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        
        {addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.labelContainer}>
                <Ionicons 
                  name={address.label === "Home" ? "home" : "briefcase"} 
                  size={18} 
                  color="#22C55E" 
                />
                <Text style={styles.addressLabel}>{address.label}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  activeOpacity={0.7}
                  onPress={() => handleEdit(address)}
                >
                  <Ionicons name="create-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.iconButton}
                  activeOpacity={0.7}
                  onPress={() => handleDelete(address.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.addressText}>{address.address}</Text>
            {address.landmark && (
              <View style={styles.landmarkContainer}>
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text style={styles.landmarkText}>{address.landmark}</Text>
              </View>
            )}

            {!address.isDefault && (
              <TouchableOpacity 
                style={styles.setDefaultButton}
                activeOpacity={0.7}
                onPress={() => handleSetDefault(address.id)}
              >
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={{ height: 20 }} />
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#22C55E",
    borderStyle: "dashed",
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#22C55E",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  defaultBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  addressText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 8,
  },
  landmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  landmarkText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  setDefaultButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  setDefaultText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22C55E",
  },
});