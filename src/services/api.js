import { CONFIG } from '../config';
import * as SecureStore from 'expo-secure-store';

export const API_URL = CONFIG.API_URL;

export const apiCall = async (endpoint, options = {}) => {
  const { useAuth = true, ...fetchOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (useAuth) {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }

  const config = {
    ...fetchOptions,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

export const authAPI = {
  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: 'landlord' }),
      useAuth: false,
    }),
  logout: () => apiCall('/auth/logout', { method: 'POST' }),
};

export const propertyAPI = {
  getMyProperties: () => apiCall('/properties/my-properties/all'),
  getProperty: (id) => apiCall(`/properties/${id}`),
  createProperty: (propertyData) =>
    apiCall('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    }),
  updateProperty: (id, propertyData) =>
    apiCall(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    }),
  deleteProperty: (id) =>
    apiCall(`/properties/${id}`, { method: 'DELETE' }),
};

export const walletAPI = {
  getBalance: () => apiCall('/wallet/balance'),
  getTransactions: () => apiCall('/wallet/transactions'),
};

export const userAPI = {
  getProfile: () => apiCall('/profile/me'),
  updateProfile: (profileData) =>
    apiCall('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

export const caretakerAPI = {
  inviteCaretaker: (name, email, phone, propertyIds) =>
    apiCall('/caretaker/invite', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, propertyIds }),
    }),
  getMyCaretakers: () => apiCall('/caretaker/my-caretakers'),
  getMyAssignedProperties: () => apiCall('/caretaker/my-properties'),
};
