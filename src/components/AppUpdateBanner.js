import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { checkForAppUpdate, openAppUpdate } from '../services/appUpdate';

// In-app prompt shown when a newer manager APK is published. OTA updates keep
// the JS current; this banner is only for the native build.
export default function AppUpdateBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [release, setRelease] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    checkForAppUpdate().then((next) => {
      if (active && next) setRelease(next);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!release || dismissed) return null;

  const handleLater = () => {
    if (!release.forceUpdate) setDismissed(true);
  };

  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.backgroundElement, borderColor: colors.border },
        ]}
      >
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>
            Update available
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Axxspace Manager {release.latestVersion} is ready to install.
            {release.releaseNotes ? ` ${release.releaseNotes}` : ''}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.updateBtn, { backgroundColor: colors.primary }]}
              onPress={() => openAppUpdate(release)}
              activeOpacity={0.85}
            >
              <Text style={styles.updateText}>Update now</Text>
            </TouchableOpacity>
            {!release.forceUpdate ? (
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={handleLater}
                activeOpacity={0.7}
              >
                <Text style={[styles.laterText, { color: colors.textSecondary }]}>
                  Later
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 1000,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  updateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  updateText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  laterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  laterText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
