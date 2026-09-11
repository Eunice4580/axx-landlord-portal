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
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ onLoginSuccess }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [selectedRole, setSelectedRole] = useState('landlord');
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
      const response = await authAPI.login(email, password, selectedRole);

      if (!response.token || !response.user) {
        Alert.alert('Login failed', 'No token received.');
        return;
      }

      if (response.user.role !== selectedRole) {
        Alert.alert(
          'Access denied',
          `This account is not registered as a ${selectedRole}.`
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
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <View style={styles.roleSwitch}>
        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRole === 'landlord' && styles.roleOptionActive,
          ]}
          onPress={() => setSelectedRole('landlord')}
        >
          <Text
            style={[
              styles.roleOptionText,
              selectedRole === 'landlord' && styles.roleOptionTextActive,
            ]}
          >
            Landlord
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRole === 'caretaker' && styles.roleOptionActive,
          ]}
          onPress={() => setSelectedRole('caretaker')}
        >
          <Text
            style={[
              styles.roleOptionText,
              selectedRole === 'caretaker' && styles.roleOptionTextActive,
            ]}
          >
            Caretaker
          </Text>
        </TouchableOpacity>
      </View>

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
          <Text style={styles.buttonText}>Sign In as {selectedRole === 'landlord' ? 'Landlord' : 'Caretaker'}</Text>
        )}
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
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElement,
    borderRadius: 8,
    padding: 4,
    marginBottom: Spacing.four,
  },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 6,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
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
