// Create: app/(delivery)/navigation.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Styles = {
  container: ViewStyle;
  mapContainer: ViewStyle;
  mapPlaceholder: ViewStyle;
  mapText: TextStyle;
  mapSubtext: TextStyle;
  topCard: ViewStyle;
  closeButton: ViewStyle;
  navigationInfo: ViewStyle;
  infoRow: ViewStyle;
  infoBox: ViewStyle;
  infoValue: TextStyle;
  infoLabel: TextStyle;
  dividerV: ViewStyle;
  currentLocationPin: ViewStyle;
  pinIcon: ViewStyle;
  bottomSheet: ViewStyle;
  routeCard: ViewStyle;
  routePoint: ViewStyle;
  routeDot: ViewStyle;
  routeDetails: ViewStyle;
  routeLabel: TextStyle;
  routeAddress: TextStyle;
  routeLine: ViewStyle;
  actionsRow: ViewStyle;
  actionButton: ViewStyle;
  actionIcon: ViewStyle;
  actionText: TextStyle;
  arrivedButton: ViewStyle;
  arrivedText: TextStyle;
  instructions: ViewStyle;
  instructionsText: TextStyle;
};

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [distance] = useState("2.5 km");
  const [eta] = useState("15 min");
  const [currentLocation] = useState("MG Road, Bangalore");
  const [destination] = useState("New mico layout, Kudlu, Bangalore");

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openMaps = () => {
    // Open Google Maps for navigation
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    Linking.openURL(url);
  };

  const handleArrived = () => {
    Alert.alert(
      "Arrived",
      "Have you reached the destination?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Arrived",
          onPress: () => {
            router.push({
              pathname: "/(delivery)/delivery-proof",
              params: { orderId: params.orderId }
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={80} color="#CBD5E1" />
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>
            Integrate Google Maps or Mapbox here
          </Text>
        </View>

        {/* Top Navigation Info */}
        <View style={styles.topCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.navigationInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoValue}>{distance}</Text>
                <Text style={styles.infoLabel}>Distance</Text>
              </View>
              <View style={styles.dividerV} />
              <View style={styles.infoBox}>
                <Text style={styles.infoValue}>{eta}</Text>
                <Text style={styles.infoLabel}>ETA</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current Location Pin */}
        <View style={styles.currentLocationPin}>
          <View style={styles.pinIcon}>
            <Ionicons name="bicycle" size={24} color="#22C55E" />
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Route Info */}
        <View style={styles.routeCard}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: "#22C55E" }]} />
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>Current Location</Text>
              <Text style={styles.routeAddress}>{currentLocation}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: "#EF4444" }]} />
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeAddress}>{destination}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => makeCall("+919876543210")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="call" size={20} color="#22C55E" />
            </View>
            <Text style={styles.actionText}>Call Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={openMaps}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="navigate" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Open Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Arrived Button */}
        <TouchableOpacity 
          style={styles.arrivedButton}
          activeOpacity={0.8}
          onPress={handleArrived}
        >
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.arrivedText}>I've Arrived</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="information-circle" size={16} color="#64748B" />
          <Text style={styles.instructionsText}>
            Follow the route and tap "I've Arrived" when you reach
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  topCard: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  navigationInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 60,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  dividerV: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
  },
  currentLocationPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  pinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  routeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
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
    backgroundColor: "#CBD5E1",
    marginLeft: 5,
    marginVertical: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  arrivedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
    marginBottom: 12,
  },
  arrivedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  instructions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  instructionsText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
});