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
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { Colors, Spacing } from '../constants/theme';

const ALLOWED_ROLES = ['landlord', 'caretaker'];

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);

      if (!response.token || !response.user) {
        Alert.alert('Login failed', 'No token received.');
        return;
      }

      if (!ALLOWED_ROLES.includes(response.user.role)) {
        Alert.alert(
          'Access denied',
          'This app is only for landlords and caretakers.'
        );
        return;
      }

      await SecureStore.setItemAsync('token', response.token);
      onLoginSuccess(response.user);
    } catch (error) {
      Alert.alert('Login failed', error.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AXX Landlord Portal</Text>
      <Text style={styles.subtitle}>Sign in to manage your properties</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
