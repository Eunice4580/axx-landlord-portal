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
  login: (email, password, role) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
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

export const createPropertyWithImages = async (formDataFields, imageUris) => {
  const token = await (await import('expo-secure-store')).getItemAsync('token');
  const form = new FormData();

  Object.entries(formDataFields).forEach(([key, value]) => {
    form.append(key, value);
  });

  imageUris.forEach((uri, index) => {
    form.append('images', {
      uri,
      name: `photo_${index}.jpg`,
      type: 'image/jpeg',
    });
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/properties`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.error || 'Failed to create property'));
        }
      } catch (e) {
        reject(new Error('Failed to parse server response'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading'));

    xhr.send(form);
  });
};

export const updateBookedUnits = (propertyId, change) =>
  apiCall(`/properties/${propertyId}/book`, {
    method: 'PATCH',
    body: JSON.stringify({ change }),
  });

export const paymentAPI = {
  getHistory: () => apiCall('/payment/history'),
};
