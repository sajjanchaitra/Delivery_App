import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage, StorageKeys } from '../../utils/storage';

type Gender = 'male' | 'female' | 'other' | '';

const COLORS = {
  primary: "#DC2626",
  secondary: "#F87171",
  danger: "#DC2626",
  success: "#22C55E",
  
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  border: "#E2E8F0",
  
  softBlue: "#EFF6FF",
  softPink: "#FEE2E2",
};

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '' as Gender,
    dateOfBirth: '',
    location: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('🔍 Loading profile...');
      const profile = await storage.getItem(StorageKeys.USER_PROFILE);
      
      if (profile) {
        console.log('✅ Profile loaded:', profile);
        setFormData(profile);
      } else {
        console.log('ℹ️ No profile found, using empty form');
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('💾 Attempting to save profile...');
    console.log('📝 Form data:', formData);

    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      setSaving(true);
      
      console.log('💾 Saving to storage...');
      const success = await storage.setItem(StorageKeys.USER_PROFILE, formData);
      
      console.log('💾 Save result:', success);
      
      if (success) {
        // Verify it was saved
        const savedData = await storage.getItem(StorageKeys.USER_PROFILE);
        console.log('✅ Verification - Data in storage:', savedData);
        
        Alert.alert('Success', 'Profile updated successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              console.log('👈 Going back...');
              router.back();
            }
          }
        ]);
      } else {
        console.error('❌ Save returned false');
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Error', 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => {
                console.log('Name changed:', text);
                setFormData(prev => ({ ...prev, name: text }));
              }}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => {
                console.log('Email changed:', text);
                setFormData(prev => ({ ...prev, email: text }));
              }}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => {
                console.log('Phone changed:', text);
                setFormData(prev => ({ ...prev, phone: text }));
              }}
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {(['male', 'female', 'other'] as Gender[]).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    formData.gender === gender && styles.genderOptionActive,
                  ]}
                  onPress={() => {
                    console.log('Gender selected:', gender);
                    setFormData(prev => ({ ...prev, gender }));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      formData.gender === gender
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={20}
                    color={formData.gender === gender ? COLORS.primary : COLORS.textLight}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === gender && styles.genderTextActive,
                    ]}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={formData.dateOfBirth}
              onChangeText={(text) => {
                console.log('DOB changed:', text);
                setFormData(prev => ({ ...prev, dateOfBirth: text }));
              }}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={[styles.input, styles.locationInput]}
              value={formData.location}
              onChangeText={(text) => {
                console.log('Location changed:', text);
                setFormData(prev => ({ ...prev, location: text }));
              }}
              placeholder="Enter your location"
              placeholderTextColor={COLORS.textLight}
              multiline
            />
          </View>

          {/* Debug Info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Current Form Data:</Text>
            <Text style={styles.debugText}>{JSON.stringify(formData, null, 2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  locationInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  genderOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.softPink,
  },
  genderText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  genderTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: COLORS.softBlue,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});