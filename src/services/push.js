import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiCall } from './api';

const PUSH_TOKEN_KEY = 'expoPushToken';
const ANDROID_CHANNEL_ID = 'messages';

let remoteRegistered = false;

export const isRemotePushRegistered = () => remoteRegistered;

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
 * Requests notification permission, registers this device's Expo push token with
 * the backend and remembers it so logout can unregister the device.
 */
export async function registerForPushNotifications() {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Notifications.requestPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        remoteRegistered = false;
        return { ok: false, reason: 'permission-denied' };
      }
    }

    await ensureAndroidChannel();

    const id = projectId();
    if (!id) {
      remoteRegistered = false;
      return { ok: false, reason: 'missing-project-id' };
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
    await apiCall('/users/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    remoteRegistered = true;
    return { ok: true, token };
  } catch (error) {
    remoteRegistered = false;
    console.log('Push registration failed:', error.message);
    return { ok: false, reason: error.message };
  }
}

export async function unregisterPushNotifications() {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (token) {
      await apiCall('/users/push-token', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      });
    }
  } catch (error) {
    console.log('Push unregister failed:', error.message);
  } finally {
    remoteRegistered = false;
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
  }
}

/**
 * Foreground fallback used only when remote push registration is unavailable
 * (for example an Expo Go build or a device without Firebase credentials).
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
