import * as SecureStore from 'expo-secure-store';

const READ_KEY = 'landlord_read_message_ids';

export async function getReadNotificationIds() {
  try {
    const stored = await SecureStore.getItemAsync(READ_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function markNotificationsRead(ids) {
  const current = await getReadNotificationIds();
  const next = Array.from(new Set([...current, ...ids]));
  try {
    await SecureStore.setItemAsync(READ_KEY, JSON.stringify(next));
  } catch {
    // Callers keep their in-memory state if device storage fails.
  }
  return next;
}

export const isNotificationRead = (notification, readIds) =>
  Boolean(notification.read || readIds.includes(notification._id || notification.id));
