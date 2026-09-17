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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ForgotPasswordScreen from './ForgotPasswordScreen';

export default function LoginScreen({ onLoginSuccess }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [selectedRole, setSelectedRole] = useState('landlord');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Brand Header */}
        <View style={styles.brandBlock}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>AXX</Text>
          </View>
          <Text style={styles.brandName}>AXXSPACE</Text>
          <Text style={styles.tagline}>Axxspace Manager</Text>
        </View>

        {/* Role Selector */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleTab, selectedRole === 'landlord' && styles.roleTabActive]}
            onPress={() => setSelectedRole('landlord')}
          >
            <Text style={[styles.roleTabText, selectedRole === 'landlord' && styles.roleTabTextActive]}>
              Landlord
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTab, selectedRole === 'caretaker' && styles.roleTabActive]}
            onPress={() => setSelectedRole('caretaker')}
          >
            <Text style={[styles.roleTabText, selectedRole === 'caretaker' && styles.roleTabTextActive]}>
              Caretaker
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email address</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordFocused && styles.inputFocused]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.showToggle}
                onPress={() => setShowPassword((p) => !p)}
              >
                <Text style={styles.showToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                Sign in as {selectedRole === 'landlord' ? 'Landlord' : 'Caretaker'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => setShowForgotPassword(true)}
          >
            <Text style={styles.forgotLinkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>AXX Spaces — Space hunting bila stress.</Text>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: colors.background,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandName: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
    marginTop: Spacing.one,
    letterSpacing: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleTab: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 6,
  },
  roleTabActive: {
    backgroundColor: colors.primary,
  },
  roleTabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleTabTextActive: {
    color: '#fff',
  },
  form: {
    gap: Spacing.three,
  },
  inputGroup: {
    marginBottom: Spacing.two,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    fontSize: FontSize.md,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 60,
  },
  showToggle: {
    position: 'absolute',
    right: 14,
  },
  showToggleText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.six,
  },
});
