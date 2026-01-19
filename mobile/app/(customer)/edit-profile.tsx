// Create: app/(customer)/edit-profile.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@email.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [dateOfBirth, setDateOfBirth] = useState("15/03/1990");

  const handleSave = () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    
    // Save profile (API call would go here)
    Alert.alert(
      "Success",
      "Profile updated successfully!",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        }
      ]
    );
  };

  const handleChangePhoto = () => {
    Alert.alert(
      "Change Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => console.log("Camera") },
        { text: "Choose from Gallery", onPress: () => console.log("Gallery") },
        { text: "Cancel", style: "cancel" }
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.changePhotoButton}
              activeOpacity={0.7}
              onPress={handleChangePhoto}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                editable={false}
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity style={styles.genderButton} activeOpacity={0.7}>
                <View style={styles.radioOuter}>
                  <View style={styles.radioInner} />
                </View>
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.genderButton} activeOpacity={0.7}>
                <View style={styles.radioOuter} />
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.genderButton} activeOpacity={0.7}>
                <View style={styles.radioOuter} />
                <Text style={styles.genderText}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
  photoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  changePhotoButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  changePhotoText: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "600",
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
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
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 16,
  },
  genderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  genderText: {
    fontSize: 14,
    color: "#1E293B",
  },
  saveButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});