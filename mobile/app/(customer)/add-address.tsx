import React, { useState } from 'react';
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
import { storage, StorageKeys } from '../utils/storage';

type AddressType = 'home' | 'work' | 'other';

export default function AddAddress() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'home' as AddressType,
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  const handleSave = async () => {
    console.log('💾 Attempting to save address...');
    console.log('📝 Form data:', formData);

    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter recipient name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    if (!formData.addressLine1.trim()) {
      Alert.alert('Error', 'Please enter address');
      return;
    }
    if (!formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      
      // Get existing addresses
      console.log('📖 Loading existing addresses...');
      const addresses = await storage.getItem(StorageKeys.ADDRESSES) || [];
      console.log('📖 Existing addresses:', addresses);
      
      // Create new address with unique ID
      const newAddress = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      console.log('🆕 New address:', newAddress);

      // If this is the first address or set as default, make it default
      if (addresses.length === 0 || formData.isDefault) {
        // Remove default from other addresses
        addresses.forEach((addr: any) => {
          addr.isDefault = false;
        });
        newAddress.isDefault = true;
      }

      // Add new address
      addresses.push(newAddress);
      
      console.log('💾 Saving addresses array:', addresses);
      
      // Save to storage
      const success = await storage.setItem(StorageKeys.ADDRESSES, addresses);
      
      console.log('💾 Save result:', success);
      
      if (success) {
        // Verify it was saved
        const savedAddresses = await storage.getItem(StorageKeys.ADDRESSES);
        console.log('✅ Verification - Addresses in storage:', savedAddresses);
        
        Alert.alert('Success', 'Address added successfully!', [
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
        Alert.alert('Error', 'Failed to save address. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving address:', error);
      Alert.alert('Error', 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Type</Text>
            <View style={styles.typeContainer}>
              {(['home', 'work', 'other'] as AddressType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.type === type && styles.typeOptionActive,
                  ]}
                  onPress={() => {
                    console.log('Type selected:', type);
                    setFormData(prev => ({ ...prev, type }));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={type === 'home' ? 'home' : type === 'work' ? 'briefcase' : 'location'}
                    size={20}
                    color={formData.type === type ? '#22C55E' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      formData.type === type && styles.typeTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter recipient name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="Enter phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Line 1 *</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine1}
              onChangeText={(text) => setFormData(prev => ({ ...prev, addressLine1: text }))}
              placeholder="House no., Building name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine2}
              onChangeText={(text) => setFormData(prev => ({ ...prev, addressLine2: text }))}
              placeholder="Road name, Area, Colony"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Landmark</Text>
            <TextInput
              style={styles.input}
              value={formData.landmark}
              onChangeText={(text) => setFormData(prev => ({ ...prev, landmark: text }))}
              placeholder="E.g., Near Park, Opposite Mall"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="City"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                value={formData.pincode}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))}
                placeholder="Pincode"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
              placeholder="State"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={styles.defaultContainer}
            onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
            activeOpacity={0.7}
          >
            <Ionicons
              name={formData.isDefault ? 'checkbox' : 'square-outline'}
              size={24}
              color={formData.isDefault ? '#22C55E' : '#94A3B8'}
            />
            <Text style={styles.defaultText}>Set as default address</Text>
          </TouchableOpacity>

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
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
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
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  typeOptionActive: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  typeText: {
    fontSize: 14,
    color: '#64748B',
  },
  typeTextActive: {
    color: '#22C55E',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  defaultText: {
    fontSize: 15,
    color: '#1E293B',
  },
  debugContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveButton: {
    backgroundColor: '#22C55E',
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