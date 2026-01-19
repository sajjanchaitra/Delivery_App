// Create: app/(customer)/add-address.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AddAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const isEditMode = params.mode === "edit";
  
  const [selectedType, setSelectedType] = useState(
    (params.label as string) || "Home"
  );
  const [fullAddress, setFullAddress] = useState(
    (params.address as string) || ""
  );
  const [landmark, setLandmark] = useState(
    (params.landmark as string) || ""
  );
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const addressTypes = ["Home", "Office", "Other"];

  const handleSave = () => {
    if (!fullAddress.trim()) {
      Alert.alert("Error", "Please enter your address");
      return;
    }
    if (!pincode.trim()) {
      Alert.alert("Error", "Please enter pincode");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Error", "Please enter city");
      return;
    }

    // Save address (API call would go here)
    Alert.alert(
      "Success",
      `Address ${isEditMode ? 'updated' : 'added'} successfully!`,
      [
        {
          text: "OK",
          onPress: () => router.back(),
        }
      ]
    );
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
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Address" : "Add New Address"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Address Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Save Address As</Text>
          <View style={styles.typeContainer}>
            {addressTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.typeButtonActive
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons 
                  name={
                    type === "Home" ? "home" : 
                    type === "Office" ? "briefcase" : 
                    "location"
                  }
                  size={20}
                  color={selectedType === type ? "#FFFFFF" : "#64748B"}
                />
                <Text style={[
                  styles.typeText,
                  selectedType === type && styles.typeTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Full Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Address *</Text>
          <TextInput
            style={styles.textArea}
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="House/Flat No., Building Name, Area, Street"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Landmark */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Landmark (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Nearby landmark"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Pincode and City */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.inputBox}
              value={pincode}
              onChangeText={setPincode}
              placeholder="560068"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.inputBox}
              value={city}
              onChangeText={setCity}
              placeholder="Bangalore"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* State */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="map-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="Karnataka"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Use Current Location */}
        <TouchableOpacity style={styles.locationButton} activeOpacity={0.8}>
          <View style={styles.locationIconContainer}>
            <Ionicons name="navigate" size={20} color="#22C55E" />
          </View>
          <Text style={styles.locationButtonText}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {isEditMode ? "Update Address" : "Save Address"}
          </Text>
        </TouchableOpacity>

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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeButtonActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  typeTextActive: {
    color: "#FFFFFF",
  },
  inputGroup: {
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 100,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  inputBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#16A34A",
  },
  saveButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});