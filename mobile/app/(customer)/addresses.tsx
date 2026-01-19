import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage, StorageKeys } from '../utils/storage';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function Addresses() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload addresses when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async () => {
    try {
      console.log('📖 Loading addresses...');
      const savedAddresses = await storage.getItem(StorageKeys.ADDRESSES) || [];
      console.log('✅ Loaded addresses:', savedAddresses);
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('❌ Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }));
      
      await storage.setItem(StorageKeys.ADDRESSES, updatedAddresses);
      setAddresses(updatedAddresses);
      Alert.alert('Success', 'Default address updated');
    } catch (error) {
      console.error('❌ Error setting default:', error);
      Alert.alert('Error', 'Failed to update default address');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAddresses = addresses.filter(addr => addr.id !== id);
              
              // If deleted address was default and there are remaining addresses, make first one default
              if (updatedAddresses.length > 0) {
                const wasDefault = addresses.find(addr => addr.id === id)?.isDefault;
                if (wasDefault) {
                  updatedAddresses[0].isDefault = true;
                }
              }
              
              await storage.setItem(StorageKeys.ADDRESSES, updatedAddresses);
              setAddresses(updatedAddresses);
              Alert.alert('Success', 'Address deleted');
            } catch (error) {
              console.error('❌ Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (address: Address) => {
    // You can create an edit screen later
    Alert.alert('Edit Feature', 'Edit feature coming soon!');
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return 'home';
      case 'work':
        return 'briefcase';
      default:
        return 'location';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(customer)/add-address')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Addresses</Text>
            <Text style={styles.emptySubtitle}>Add an address to get started</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(customer)/add-address')}
            >
              <Text style={styles.emptyButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
                
                <View style={styles.addressHeader}>
                  <View style={styles.addressTypeContainer}>
                    <View style={styles.addressIconContainer}>
                      <Ionicons
                        name={getAddressIcon(address.type)}
                        size={20}
                        color="#22C55E"
                      />
                    </View>
                    <View style={styles.addressHeaderText}>
                      <Text style={styles.addressType}>
                        {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                      </Text>
                      <Text style={styles.addressName}>{address.name}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.addressDetails}>
                  <Text style={styles.addressText}>
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  </Text>
                  {address.landmark && (
                    <Text style={styles.addressText}>
                      Landmark: {address.landmark}
                    </Text>
                  )}
                  <Text style={styles.addressText}>
                    {address.city}, {address.state} - {address.pincode}
                  </Text>
                  <View style={styles.phoneContainer}>
                    <Ionicons name="call-outline" size={14} color="#64748B" />
                    <Text style={styles.phoneText}>{address.phone}</Text>
                  </View>
                  {address.coordinates && (
                    <View style={styles.coordinatesContainer}>
                      <Ionicons name="navigate-outline" size={14} color="#64748B" />
                      <Text style={styles.coordinatesText}>
                        GPS: {address.coordinates.latitude.toFixed(4)}, {address.coordinates.longitude.toFixed(4)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.addressActions}>
                  {!address.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
                      <Text style={styles.actionButtonText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(address)}
                  >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                    <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(address.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {addresses.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => router.push('/(customer)/add-address')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addNewButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressList: {
    padding: 20,
  },
  addressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  defaultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressHeaderText: {
    flex: 1,
  },
  addressType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  addressDetails: {
    marginBottom: 12,
    paddingLeft: 52,
  },
  addressText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  addressActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addNewButton: {
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addNewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});