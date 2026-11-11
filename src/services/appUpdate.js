import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { CONFIG } from '../config';

// Version of the native build that is running (the APK), not the OTA bundle.
export const CURRENT_APP_VERSION =
  Constants.expoConfig?.version || CONFIG.APP_VERSION;

function parseVersion(value) {
  return String(value || '')
    .split('.')
    .map((part) => parseInt(part, 10) || 0);
}

export function isNewerVersion(candidate, current) {
  const next = parseVersion(candidate);
  const installed = parseVersion(current);
  const length = Math.max(next.length, installed.length);
  for (let i = 0; i < length; i += 1) {
    const a = next[i] || 0;
    const b = installed[i] || 0;
    if (a !== b) return a > b;
  }
  return false;
}

// Returns the release manifest only when a newer manager APK is published.
export async function checkForAppUpdate() {
  try {
    const response = await fetch(
      `${CONFIG.UPDATE_MANIFEST_URL}?t=${Date.now()}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) return null;
    const release = await response.json();
    if (!release?.latestVersion) return null;
    if (!isNewerVersion(release.latestVersion, CURRENT_APP_VERSION)) return null;
    return release;
  } catch {
    // Offline or manifest unavailable — the app keeps working as normal.
    return null;
  }
}

export function openAppUpdatePage() {
  Linking.openURL(CONFIG.UPDATE_PAGE_URL).catch(() => {});
}
