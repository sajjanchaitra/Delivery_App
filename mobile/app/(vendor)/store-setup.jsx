import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://13.203.206.134:5000';

export default function StoreSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    storeType: '',
  });

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setFormData({
          name: parsedUser.name || '',
          phone: parsedUser.phone || '',
          email: parsedUser.email || '',
          storeType: parsedUser.storeType || '',
        });
        
        // Load profile image from user data (check multiple fields)
        const userImage = parsedUser.image || parsedUser.profileImage;
        if (userImage) {
          setProfileImage(userImage);
        }
      }

      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      // Fetch store data from API
      const storeResponse = await fetch(`${API_URL}/api/vendor/store`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const storeResult = await storeResponse.json();

      if (storeResult.hasStore && storeResult.store) {
        setFormData(prev => ({
          name: storeResult.store.name || prev.name,
          phone: prev.phone,
          email: prev.email,
          storeType: storeResult.store.storeType || prev.storeType,
        }));
        
        // Load profile image from store (check multiple fields)
        const storeImage = storeResult.store.image || storeResult.store.logo || storeResult.store.profileImage;
        if (storeImage) {
          setProfileImage(storeImage);
        }
      }
    } catch (error) {
      console.error('Error loading store data:', error);
      Alert.alert('Error', 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photos to upload a profile picture');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Show success message
        Alert.alert('Success', 'Profile picture selected. Click Save Changes to update.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Store name is required');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Update user data in AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const updatedUser = {
          ...parsedUser,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          storeType: formData.storeType,
          image: profileImage, // Use 'image' instead of 'profileImage'
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // API call to update store data
      const updatePayload = {
        name: formData.name,
        storeType: formData.storeType,
        image: profileImage, // Use 'image' to match what home page expects
        logo: profileImage,  // Also set logo for compatibility
      };

      const response = await fetch(`${API_URL}/api/vendor/store`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Store details updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              router.back(); // Navigate back to profile
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update store details');
      }
    } catch (error) {
      console.error('Error saving store data:', error);
      Alert.alert('Error', 'Failed to update store details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const storeTypes = ['Grocery', 'Restaurant', 'Bakery', 'Pharmacy', 'Electronics', 'Other'];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      {/* Header */}
      <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Photo</Text>
          
          <View style={styles.imageContainer}>
            <TouchableOpacity 
              style={styles.imageWrapper} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="storefront" size={40} color="#94A3B8" />
                </View>
              )}
              
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={18} color="#FFF" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.imageHint}>Tap to change store photo</Text>
          </View>
        </View>

        {/* Store Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="storefront-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter store name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {storeTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    formData.storeType === type && styles.typeChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, storeType: type })}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      formData.storeType === type && styles.typeChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Changes will be reflected immediately on your profile and visible to customers.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  imageHint: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 14,
  },
  typeScroll: {
    marginTop: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: '#22C55E',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});