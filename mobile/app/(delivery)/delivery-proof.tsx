// Create: app/(delivery)/delivery-proof.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DeliveryProofScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleTakePhoto = () => {
    // Camera integration would go here
    Alert.alert(
      "Take Photo",
      "Choose an option",
      [
        { 
          text: "Camera", 
          onPress: () => {
            setPhoto("https://images.unsplash.com/photo-1546640646-89b49b6bca20?w=400");
          }
        },
        { text: "Gallery", onPress: () => console.log("Gallery") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 4) {
      Alert.alert("Error", "Please enter 4-digit OTP");
      return;
    }
    
    // Verify OTP
    if (otp === "1234") {
      handleCompleteDelivery();
    } else {
      Alert.alert("Error", "Invalid OTP. Try again.");
    }
  };

  const handleCompleteDelivery = () => {
    if (!photo) {
      Alert.alert("Photo Required", "Please take a photo of the delivery");
      return;
    }

    Alert.alert(
      "Complete Delivery",
      "Mark this order as delivered?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            router.replace({
              pathname: "/(delivery)/delivery-success",
              params: { 
                orderId: params.orderId,
                earnings: 130
              }
            });
          }
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
        <Text style={styles.headerTitle}>Delivery Proof</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* OTP Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={24} color="#22C55E" />
            <Text style={styles.sectionTitle}>Customer OTP</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Ask customer for the 4-digit OTP to verify delivery
          </Text>
          
          <View style={styles.otpContainer}>
            {[0, 1, 2, 3].map((index) => (
              <View key={index} style={styles.otpBox}>
                <Text style={styles.otpText}>
                  {otp[index] || ""}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.keypadContainer}>
            <View style={styles.keypadRow}>
              {[1, 2, 3].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.keypadButton}
                  activeOpacity={0.7}
                  onPress={() => setOtp(prev => prev.length < 4 ? prev + num : prev)}
                >
                  <Text style={styles.keypadText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.keypadButton}
                  activeOpacity={0.7}
                  onPress={() => setOtp(prev => prev.length < 4 ? prev + num : prev)}
                >
                  <Text style={styles.keypadText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.keypadButton}
                  activeOpacity={0.7}
                  onPress={() => setOtp(prev => prev.length < 4 ? prev + num : prev)}
                >
                  <Text style={styles.keypadText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              <View style={styles.keypadButton} />
              <TouchableOpacity
                style={styles.keypadButton}
                activeOpacity={0.7}
                onPress={() => setOtp(prev => prev.length < 4 ? prev + "0" : prev)}
              >
                <Text style={styles.keypadText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keypadButton}
                activeOpacity={0.7}
                onPress={() => setOtp(prev => prev.slice(0, -1))}
              >
                <Ionicons name="backspace-outline" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.verifyButton, otp.length === 4 && styles.verifyButtonActive]}
            activeOpacity={0.8}
            disabled={otp.length !== 4}
            onPress={handleVerifyOTP}
          >
            <Text style={styles.verifyText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Proof */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera" size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Delivery Photo</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Take a photo of the delivered items
          </Text>

          {photo ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity 
                style={styles.retakeButton}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.photoButton}
              activeOpacity={0.8}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera" size={32} color="#94A3B8" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes (Optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about the delivery..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Complete Button */}
        <TouchableOpacity 
          style={[styles.completeButton, (!photo || otp.length !== 4) && styles.completeButtonDisabled]}
          activeOpacity={0.8}
          disabled={!photo || otp.length !== 4}
          onPress={handleCompleteDelivery}
        >
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.completeText}>Complete Delivery</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionDesc: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  otpText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  keypadContainer: {
    marginBottom: 16,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  keypadText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
  },
  verifyButton: {
    backgroundColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  verifyButtonActive: {
    backgroundColor: "#22C55E",
  },
  verifyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  photoButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  retakeButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  retakeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 80,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
  },
  completeButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  completeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

// EARNINGS SCREEN
// Create: app/(delivery)/earnings.tsx
export function EarningsScreen() {
  const router = useRouter();
  const [todayEarnings] = useState(2450);
  const [weekEarnings] = useState(12340);
  const [monthEarnings] = useState(45600);
  const [totalEarnings] = useState(156780);

  const earningsHistory = [
    {
      id: "1",
      orderId: "ORD12345",
      date: "Today, 3:45 PM",
      amount: 130,
      distance: "2.5 km",
    },
    {
      id: "2",
      orderId: "ORD12344",
      date: "Today, 2:30 PM",
      amount: 90,
      distance: "1.8 km",
    },
    {
      id: "3",
      orderId: "ORD12343",
      date: "Today, 1:15 PM",
      amount: 115,
      distance: "3.2 km",
    },
    {
      id: "4",
      orderId: "ORD12342",
      date: "Today, 11:30 AM",
      amount: 85,
      distance: "1.5 km",
    },
    {
      id: "5",
      orderId: "ORD12341",
      date: "Yesterday, 5:20 PM",
      amount: 105,
      distance: "2.1 km",
    },
  ];

  return (
    <View style={earningsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      {/* Header */}
      <View style={earningsStyles.header}>
        <View style={earningsStyles.headerTop}>
          <Text style={earningsStyles.headerTitle}>Earnings</Text>
          <TouchableOpacity style={earningsStyles.withdrawButton} activeOpacity={0.8}>
            <Ionicons name="card" size={20} color="#22C55E" />
            <Text style={earningsStyles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Total Earnings Card */}
        <View style={earningsStyles.totalCard}>
          <Text style={earningsStyles.totalLabel}>Total Earnings</Text>
          <Text style={earningsStyles.totalValue}>₹{totalEarnings.toLocaleString()}</Text>
        </View>

        {/* Period Stats */}
        <View style={earningsStyles.statsGrid}>
          <View style={earningsStyles.statCard}>
            <Text style={earningsStyles.statValue}>₹{todayEarnings}</Text>
            <Text style={earningsStyles.statLabel}>Today</Text>
          </View>
          <View style={earningsStyles.statCard}>
            <Text style={earningsStyles.statValue}>₹{weekEarnings}</Text>
            <Text style={earningsStyles.statLabel}>This Week</Text>
          </View>
          <View style={earningsStyles.statCard}>
            <Text style={earningsStyles.statValue}>₹{monthEarnings}</Text>
            <Text style={earningsStyles.statLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* Earnings History */}
      <View style={earningsStyles.content}>
        <View style={earningsStyles.sectionHeader}>
          <Text style={earningsStyles.sectionTitle}>Earnings History</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="filter" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {earningsHistory.map((item) => (
          <View key={item.id} style={earningsStyles.earningCard}>
            <View style={earningsStyles.earningIcon}>
              <Ionicons name="cash" size={20} color="#22C55E" />
            </View>
            <View style={earningsStyles.earningInfo}>
              <Text style={earningsStyles.earningOrderId}>{item.orderId}</Text>
              <Text style={earningsStyles.earningDate}>{item.date}</Text>
              <View style={earningsStyles.earningMeta}>
                <Ionicons name="location" size={12} color="#94A3B8" />
                <Text style={earningsStyles.earningMetaText}>{item.distance}</Text>
              </View>
            </View>
            <Text style={earningsStyles.earningAmount}>+₹{item.amount}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const earningsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#1E293B",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  withdrawText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22C55E",
  },
  totalCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  content: {
    flex: 1,
    padding: 20,
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
  earningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  earningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  earningInfo: {
    flex: 1,
  },
  earningOrderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  earningDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  earningMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  earningMetaText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  earningAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22C55E",
  },
});