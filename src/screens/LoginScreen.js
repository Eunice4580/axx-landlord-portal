import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, KeyboardAvoidingView,
  ScrollView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ForgotPasswordScreen from './ForgotPasswordScreen';

/* ── Icons ──────────────────────────────────────────────────────── */
const EyeIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

const KeyIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="8" cy="15" r="5" />
    <Path d="M14.5 9.5 21 3m-3 0 3 3-3.5 3.5-3-3" />
  </Svg>
);

const UserIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const MailIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Polyline points="22,6 12,13 2,6" />
  </Svg>
);

const LockIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export default function LoginScreen({ onLoginSuccess, onBack, onCreateAccount }) {
  const { colors } = useTheme();
  const [selectedRole, setSelectedRole] = useState('landlord');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchRole = (role) => {
    setSelectedRole(role);
    Animated.spring(slideAnim, {
      toValue: role === 'landlord' ? 0 : 1,
      useNativeDriver: false,
      tension: 60, friction: 8,
    }).start();
  };

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
      const response = await authAPI.login(email.trim(), password, selectedRole);
      if (!response.token || !response.user) {
        Alert.alert('Login failed', 'No token received.');
        return;
      }
      const returnedRole = response.user.role;
      if (returnedRole === 'host') {
        Alert.alert('Wrong Portal', 'This account is an Accommodation Host.\n\nPlease use the Accommodation portal.', [{ text: 'OK' }]);
        return;
      }
      if (returnedRole === 'user') {
        Alert.alert('Wrong Portal', 'This account is a Business Owner.\n\nPlease use the AxxBiashara portal.', [{ text: 'OK' }]);
        return;
      }
      if (returnedRole !== selectedRole) {
        Alert.alert('Access Denied', `This account is not registered as a ${selectedRole}.`);
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

  const PRIMARY = '#e11d48';
  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Brand */}
          <View style={s.brand}>
            <Image
              source={require('../../assets/axx-logo.jpg')}
              style={s.logoImage}
              resizeMode="contain"
            />
            <Text style={[s.brandName, { color: colors.text }]}>AXXSPACE</Text>
            <Text style={[s.brandSub, { color: colors.textMuted }]}>Property Manager</Text>
          </View>

          {/* Role Pill Switcher */}
          <View style={[s.rolePill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            {/* Animated sliding background */}
            <Animated.View style={[s.roleSlider, {
              backgroundColor: PRIMARY,
              left: slideAnim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '51%'] }),
            }]} />
            <TouchableOpacity style={s.roleBtn} onPress={() => switchRole('landlord')} activeOpacity={0.8}>
              <UserIcon color={selectedRole === 'landlord' ? '#fff' : colors.textMuted} size={14} />
              <Text style={[s.roleBtnText, { color: selectedRole === 'landlord' ? '#fff' : colors.textMuted }]}>
                Landlord
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.roleBtn} onPress={() => switchRole('caretaker')} activeOpacity={0.8}>
              <KeyIcon color={selectedRole === 'caretaker' ? '#fff' : colors.textMuted} size={14} />
              <Text style={[s.roleBtnText, { color: selectedRole === 'caretaker' ? '#fff' : colors.textMuted }]}>
                Caretaker
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={s.form}>
            {/* Email */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[s.inputWrap, {
              borderColor: emailFocused ? PRIMARY : colors.border,
              backgroundColor: colors.backgroundElement,
            }]}>
              <MailIcon color={emailFocused ? PRIMARY : colors.textMuted} size={17} />
              <TextInput
                style={[s.input, { color: colors.text }]}
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

            {/* Password */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={[s.inputWrap, {
              borderColor: passwordFocused ? PRIMARY : colors.border,
              backgroundColor: colors.backgroundElement,
            }]}>
              <LockIcon color={passwordFocused ? PRIMARY : colors.textMuted} size={17} />
              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                {showPassword
                  ? <EyeOffIcon color={colors.textMuted} size={18} />
                  : <EyeIcon color={colors.textMuted} size={18} />}
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity style={s.forgotLink} onPress={() => setShowForgotPassword(true)}>
              <Text style={[s.forgotText, { color: PRIMARY }]}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign in button */}
            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled, { backgroundColor: PRIMARY }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>
                    Sign in as {selectedRole === 'landlord' ? 'Landlord' : 'Caretaker'}
                  </Text>}
            </TouchableOpacity>
          </View>

          <Text style={[s.footer, { color: colors.textMuted }]}>
            AXX Spaces Manager
          </Text>

          {/* Back to Portal Selector */}
          {onBack && (
            <TouchableOpacity onPress={onBack} style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: PRIMARY, fontSize: 13, fontWeight: '700' }}>
                ← Back to Portal Selector
              </Text>
            </TouchableOpacity>
          )}

          {/* Create Account */}
          {onCreateAccount && (
            <TouchableOpacity onPress={onCreateAccount} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: PRIMARY, fontSize: 13, fontWeight: '700' }}>
                Don't have an account? Create Account
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },

  brand: { alignItems: 'center', marginBottom: Spacing.five },
  logoImage: {
    width: 88, height: 88, borderRadius: 22,
    marginBottom: Spacing.two,
    backgroundColor: '#fff',
    shadowColor: '#e11d48', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 22, elevation: 8,
  },
  brandName: { fontSize: 26, fontWeight: '900', letterSpacing: 4, marginBottom: 4 },
  brandSub: { fontSize: FontSize.sm, fontWeight: '500', letterSpacing: 0.5 },

  // Role switcher
  rolePill: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: Spacing.four,
    position: 'relative',
    height: 48,
  },
  roleSlider: {
    position: 'absolute',
    top: 4, bottom: 4,
    width: '48%',
    borderRadius: 10,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  roleBtnText: { fontSize: FontSize.sm, fontWeight: '700' },

  // Form
  form: {},
  label: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 7, marginTop: Spacing.two,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, height: 52, gap: 10,
  },
  input: { flex: 1, fontSize: FontSize.md, paddingVertical: 0 },
  eyeBtn: { padding: 4 },

  forgotLink: { alignItems: 'flex-end', marginTop: 10, marginBottom: Spacing.two },
  forgotText: { fontSize: 13, fontWeight: '700' },

  btn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.two,
    shadowColor: '#e11d48', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.3 },

  footer: { textAlign: 'center', fontSize: 11, marginTop: Spacing.five, letterSpacing: 0.5 },
});
