import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiCall } from './api';

const ANDROID_CHANNEL_ID = 'messages';
const tokenStoreKey = (tokenKey) => `expoPushToken:${tokenKey}`;

// Registration state is tracked per portal session so the local fallback can
// still run where remote push is unavailable (for example Expo Go).
const registeredSessions = new Set();

export const isRemotePushRegistered = (tokenKey = 'token') =>
  registeredSessions.has(tokenKey);

const projectId = () =>
  Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#e11d48',
    sound: 'default',
  });
}

/**
 * Requests notification permission, registers this device's Expo push token for
 * the signed-in portal session and remembers it so logout can unregister it.
 */
export async function registerForPushNotifications(tokenKey = 'token') {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Notifications.requestPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        registeredSessions.delete(tokenKey);
        return { ok: false, reason: 'permission-denied' };
      }
    }

    await ensureAndroidChannel();

    const id = projectId();
    if (!id) {
      registeredSessions.delete(tokenKey);
      return { ok: false, reason: 'missing-project-id' };
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
    await apiCall('/users/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
      tokenKey,
    });
    await SecureStore.setItemAsync(tokenStoreKey(tokenKey), token);
    registeredSessions.add(tokenKey);
    return { ok: true, token };
  } catch (error) {
    registeredSessions.delete(tokenKey);
    console.log('Push registration failed:', error.message);
    return { ok: false, reason: error.message };
  }
}

export async function unregisterPushNotifications(tokenKey = 'token') {
  try {
    const token = await SecureStore.getItemAsync(tokenStoreKey(tokenKey));
    if (token) {
      await apiCall('/users/push-token', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
        tokenKey,
      });
    }
  } catch (error) {
    console.log('Push unregister failed:', error.message);
  } finally {
    registeredSessions.delete(tokenKey);
    await SecureStore.deleteItemAsync(tokenStoreKey(tokenKey)).catch(() => {});
  }
}

/**
 * Foreground fallback used only when remote push registration is unavailable.
 */
export async function notifyLocally({ title, body, data = {} }) {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: null,
    });
  } catch (error) {
    console.log('Local notification failed:', error.message);
  }
}
