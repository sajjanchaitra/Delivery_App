import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER_PROFILE: 'user_profile',
  ADDRESSES: 'user_addresses',
  ORDERS: 'user_orders',
  CART: 'user_cart',
  PAYMENT_METHODS: 'payment_methods',
};

export const storage = {
  // Save data
  async setItem(key: string, value: any) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log('✅ Data saved:', key); // Debug log
      return true;
    } catch (error) {
      console.error('❌ Error saving data:', error);
      return false;
    }
  },

  // Get data
  async getItem(key: string) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      const data = jsonValue != null ? JSON.parse(jsonValue) : null;
      console.log('📖 Data loaded:', key, data); // Debug log
      return data;
    } catch (error) {
      console.error('❌ Error reading data:', error);
      return null;
    }
  },

  // Remove data
  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
      console.log('🗑️ Data removed:', key); // Debug log
      return true;
    } catch (error) {
      console.error('❌ Error removing data:', error);
      return false;
    }
  },

  // Clear all data
  async clear() {
    try {
      await AsyncStorage.clear();
      console.log('🧹 All data cleared'); // Debug log
      return true;
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      return false;
    }
  },
};