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

export default function ChangeEmailScreen({ onBack, onEmailChanged }) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handleSubmit = async () => {
    if (!newEmail || !password) {
      Alert.alert('Missing info', 'Please fill in both fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await profileUpdateAPI.changeEmail(newEmail, password);
      Alert.alert('Success', 'Email changed successfully.', [
        {
          text: 'OK',
          onPress: () => {
            if (onEmailChanged && response?.data?.user) {
              onEmailChanged(response.data.user);
            }
            onBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Failed', error.message || 'Could not change email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Change Email</Text>

      <TextInput
        style={styles.input}
        placeholder="New Email"
        value={newEmail}
        onChangeText={setNewEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Change Email</Text>
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
