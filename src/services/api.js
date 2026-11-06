import { CONFIG } from '../config';
import * as SecureStore from 'expo-secure-store';

export const API_URL = CONFIG.API_URL;

export const apiCall = async (endpoint, options = {}) => {
  const { useAuth = true, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server may be waking up — please try again in a moment.');
    }
    if (error.message === 'Network request failed') {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    console.error('API call error:', error.message);
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
  inviteCaretaker: (name, email, phone, password, propertyIds, notes) =>
    apiCall('/caretaker/invite', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, propertyIds, notes }),
    }),
  getMyCaretakers: () => apiCall('/caretaker/my-caretakers'),
  getMyAssignedProperties: () => apiCall('/caretaker/my-properties'),
};

export const createPropertyWithImages = async (formDataFields, imageUris, videoAssets = []) => {
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

  videoAssets.forEach((asset, index) => {
    const uri = asset.uri;
    const ext = uri.split('.').pop() || 'mp4';
    form.append('videos', {
      uri,
      name: asset.fileName || `walkthrough_${Date.now()}_${index}.${ext}`,
      type: asset.mimeType || 'video/mp4',
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

// ── Landlord performance analytics ─────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: (userType = 'landlord', period = '7d') =>
    apiCall(`/analytics/summary?userType=${userType}&period=${period}`),
};

// ── Agent requests (landlords / hosts receive these) ───────────────────────────
export const agentRequestsAPI = {
  getProviderRequests: () => apiCall('/agent-requests/provider'),
  accept: (requestId) =>
    apiCall(`/agent-requests/${requestId}/accept`, { method: 'PUT' }),
  reject: (requestId, response) =>
    apiCall(`/agent-requests/${requestId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ response }),
    }),
};

// ── Messages / notification inbox ─────────────────────────────────────────────
export const notificationsAPI = {
  getMy: () => apiCall('/notifications/my'),
  markRead: (id) => apiCall(`/notifications/${id}/read`, { method: 'PUT' }),
};

// ── Waitlist API ───────────────────────────────────────────────────────────────
export const waitlistAPI = {
  // Landlord: get all waitlist entries across all their properties (FIFO ordered)
  getAllForLandlord: () => apiCall('/waitlist/landlord/all'),
  // Landlord: get waitlist for a specific property
  getForProperty: (propertyId) => apiCall(`/waitlist/${propertyId}`),
  // Landlord: send "unit available" email + WhatsApp notification
  notify: (entryId) => apiCall(`/waitlist/${entryId}/notify`, { method: 'POST' }),
  // Landlord: remove a person from waitlist
  remove: (entryId) => apiCall(`/waitlist/${entryId}`, { method: 'DELETE' }),
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

export const uploadOwnershipDocument = async (asset, tokenKey = 'token') => {
  const token = await (await import('expo-secure-store')).getItemAsync(tokenKey);
  const form = new FormData();
  form.append('document', {
    uri: asset.uri,
    name: asset.fileName || asset.name || `ownership_${Date.now()}.pdf`,
    type: asset.mimeType || asset.type || 'application/octet-stream',
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/uploads/ownership-document`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.url) {
          resolve(data.url);
        } else {
          reject(new Error(data.error || 'Failed to upload ownership document'));
        }
      } catch {
        reject(new Error('Failed to parse document upload response'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading document'));
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
      const err = new Error(data.details || data.error || data.message || `Request failed (${response.status})`);
      err.status = response.status;
      err.data = data;
      throw err;
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

// AxxBiashara Auth — business owners sign in through the same /auth/login as the
// website's business portal. The backend isolates portal roles, so this must ask
// for role: 'business' exactly like BusinessLogin.jsx does.
export const biasharaAuthAPI = {
  login: async (email, password) => {
    try {
      return await apiCallBiashara('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: 'business' }),
        useAuth: false,
      });
    } catch (error) {
      // Accounts created by older app builds were stored as Member/User; keep
      // those usable in the app while new accounts are created as Business.
      if (
        error?.data?.code === 'ROLE_MISMATCH' &&
        ['user', 'member', 'guest'].includes(error.data.actualRole)
      ) {
        return apiCallBiashara('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, role: 'user' }),
          useAuth: false,
        });
      }
      throw error;
    }
  },
  forgotPassword: (email) =>
    apiCallBiashara('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
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

// Business boosts — same endpoints the website uses from QuickBoostModal
export const biasharaPaymentAPI = {
  initiateMpesa: ({ phone, amount, plan, businessId }) =>
    apiCallBiashara('/payment/initiate-mpesa', {
      method: 'POST',
      body: JSON.stringify({ phone, amount, plan, businessId }),
    }),
  submitBankTransfer: ({ amount, plan, transactionRef, bankMessage, businessId }) =>
    apiCallBiashara('/payment/bank-transfer', {
      method: 'POST',
      body: JSON.stringify({ amount, plan, transactionRef, bankMessage, businessId }),
    }),
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
