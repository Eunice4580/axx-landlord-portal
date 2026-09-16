import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { profileUpdateAPI } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function ChangePasswordScreen({ onBack }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too short', 'New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await profileUpdateAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      Alert.alert('Failed', error.message || 'Could not change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Change Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry={!showPasswords}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showPasswords}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPasswords}
      />

      <TouchableOpacity onPress={() => setShowPasswords((p) => !p)}>
        <Text style={styles.toggleText}>
          {showPasswords ? 'Hide passwords' : 'Show passwords'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Change Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: Spacing.four },
  backLink: { color: colors.primary, fontSize: 15, marginBottom: Spacing.three },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: Spacing.four },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    fontSize: 16,
    color: colors.text,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.four,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
