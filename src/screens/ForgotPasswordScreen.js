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
import { authExtraAPI } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await authExtraAPI.forgotPassword(email);
      setSent(true);
    } catch (error) {
      Alert.alert('Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.message}>
          If an account exists for {email}, we've sent a password reset
          link. Open it from your phone's email app to set a new password,
          then come back here to log in.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.message}>
        Enter the email associated with your account and we'll send you a
        link to reset your password.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={onBack}>
        <Text style={styles.backLinkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.five,
    lineHeight: 20,
  },
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
  backLink: { marginTop: Spacing.four, alignItems: 'center' },
  backLinkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
