import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import InviteCaretakerScreen from './InviteCaretakerScreen';

export default function SettingsScreen({ user, onLogout }) {
  const [showInvite, setShowInvite] = useState(false);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = getStyles(colors);

  if (showInvite) {
    return <InviteCaretakerScreen onBack={() => setShowInvite(false)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{user?.phone}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role}</Text>
      </View>

      <View style={styles.themeRow}>
        <Text style={styles.themeLabel}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      {user?.role === 'landlord' && (
        <TouchableOpacity style={styles.button} onPress={() => setShowInvite(true)}>
          <Text style={styles.buttonText}>+ Invite Caretaker</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: Spacing.four },
  header: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: Spacing.four },
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: Spacing.two },
  value: { fontSize: 15, color: colors.text, fontWeight: '600' },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  themeLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
  },
  logoutButtonText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
