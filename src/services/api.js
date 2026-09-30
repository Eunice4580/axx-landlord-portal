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
  getProfile: () => apiCall('/auth/me'),
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

export const qrStatsAPI = {
  getStats: (propertyId) => apiCall(`/properties/${propertyId}/qr-stats`),
};

export const updatePropertyWithImages = async (propertyId, formDataFields, newImageUris, remainingImageUrls) => {
  const token = await (await import('expo-secure-store')).getItemAsync('token');
  const form = new FormData();

  Object.entries(formDataFields).forEach(([key, value]) => {
    form.append(key, value);
  });

  form.append('remainingImages', JSON.stringify(remainingImageUrls));

  newImageUris.forEach((uri, index) => {
    form.append('images', {
      uri,
      name: `photo_${index}.jpg`,
      type: 'image/jpeg',
    });
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PATCH', `${API_URL}/properties/${propertyId}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.error || 'Failed to update property'));
        }
      } catch (e) {
        reject(new Error('Failed to parse server response'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while updating'));

    xhr.send(form);
  });
};

export const deleteProperty = (propertyId) =>
  apiCall(`/properties/${propertyId}`, { method: 'DELETE' });

export const caretakerManagementAPI = {
  updateProperties: (caretakerId, propertyIds) =>
    apiCall(`/caretaker/${caretakerId}/properties`, {
      method: 'PATCH',
      body: JSON.stringify({ propertyIds }),
    }),
  removeCaretaker: (caretakerId) =>
    apiCall(`/caretaker/${caretakerId}`, { method: 'DELETE' }),
};

export const authExtraAPI = {
  forgotPassword: (email) =>
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, platform: 'app' }),
      useAuth: false,
    }),
};

export const resetPasswordAPI = (token, password) =>
  apiCall(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: JSON.stringify({ password }),
    useAuth: false,
  });

// ── AxxBiashara Portal APIs ────────────────────────────────────────────────────

/**
 * Dedicated API caller for AxxBiashara portal.
 * Uses 'biashara_token' for auth.
 * Has a 35-second timeout for Render.com cold starts.
 */
const apiCallBiashara = async (endpoint, options = {}) => {
  const { useAuth = true, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (useAuth) {
    try {
      const token = await SecureStore.getItemAsync('biashara_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error getting biashara token:', e);
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed (${response.status})`);
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server may be waking up — please try again.');
    }
    if (error.message === 'Network request failed') {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    console.error('Biashara API error:', error.message);
    throw error;
  }
};

// AxxBiashara Auth — business owners log in via the standard /auth/login.
// They are stored with role: 'user' in the DB (same as the website's BusinessLogin.jsx).
// Account creation (signup) is done on the website only; the app is sign-in only.
export const biasharaAuthAPI = {
  login: (email, password) =>
    apiCallBiashara('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: 'user' }),
      useAuth: false,
    }),
  forgotPassword: (email) =>
    apiCallBiashara('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, role: 'user' }),
      useAuth: false,
    }),
  getMe: () => apiCallBiashara('/auth/me'),
};

// Business profile management
export const biasharaBusinessAPI = {
  // ── Read ──────────────────────────────────────────────────────────
  getMyBusiness: () => apiCallBiashara('/business/my'),
  getBusinessById: (id) => apiCallBiashara(`/business/${id}`),

  // ── Create ────────────────────────────────────────────────────────
  // POST /api/business — authenticated, JSON body matching backend schema
  createBusiness: (data) =>
    apiCallBiashara('/business', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Update / Delete ───────────────────────────────────────────────
  updateMyBusiness: (id, data) =>
    apiCallBiashara(`/business/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBusiness: (id) =>
    apiCallBiashara(`/business/${id}`, { method: 'DELETE' }),

  // ── Reviews ───────────────────────────────────────────────────────
  getMyReviews: () => apiCallBiashara('/business-reviews/my'),
  getBusinessReviews: (businessId) =>
    apiCallBiashara(`/business-reviews/business/${businessId}`),

  // ── Analytics ─────────────────────────────────────────────────────
  getBusinessAnalytics: (businessId) =>
    apiCallBiashara(`/business-analytics/${businessId}`),

  // ── Inquiries ─────────────────────────────────────────────────────
  getMyInquiries: () => apiCallBiashara('/business-inquiries/my'),
  getBusinessInquiries: (businessId) =>
    apiCallBiashara(`/business-inquiries/business/${businessId}`),
  respondToInquiry: (inquiryId, response) =>
    apiCallBiashara(`/business-inquiries/${inquiryId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response }),
    }),

  // ── Announcements ─────────────────────────────────────────────────
  getMyAnnouncements: (id) => apiCallBiashara(`/business/${id}/announcements`),
};

// Biashara profile: change password, update name/phone — all native in-app
export const biasharaProfileAPI = {
  changePassword: (currentPassword, newPassword) =>
    apiCallBiashara('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  updateProfile: (name, phone) =>
    apiCallBiashara('/profile/me', {
      method: 'PUT',
      body: JSON.stringify({ name, phone }),
    }),
};

// Materials / listings management
export const biasharaMaterialsAPI = {
  getMyListings: () => apiCallBiashara('/materials/seller/my-materials'),
  markAsSold: (id) =>
    apiCallBiashara(`/materials/${id}/sold`, { method: 'PATCH' }),
  deleteListing: (id) =>
    apiCallBiashara(`/materials/${id}`, { method: 'DELETE' }),
  createMaterial: () => '/materials/create', // XHR endpoint — used directly in BiasharaUploadScreen
};

export const profileUpdateAPI = {
  changePassword: (currentPassword, newPassword) =>
    apiCall('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  changeEmail: (newEmail, password) =>
    apiCall('/profile/change-email', {
      method: 'POST',
      body: JSON.stringify({ newEmail, password }),
    }),
  updateContact: (name, phone, avatarUri) => {
    const form = new FormData();
    if (name) form.append('name', name);
    if (phone) form.append('phone', phone);
    if (avatarUri) {
      form.append('avatar', {
        uri: avatarUri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });
    }
    return apiCall('/profile', {
      method: 'PATCH',
      body: form,
      headers: {},
    });
  },
};
