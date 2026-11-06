import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ForgotPasswordScreen from './ForgotPasswordScreen';

const ACCENT = '#e11d48';

/* ── Icons ──────────────────────────────────────────────────────── */
const ArrowLeftIcon = ({ color = ACCENT, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Polyline points="12 19 5 12 12 5" />
  </Svg>
);

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

const AlertIcon = ({ color = '#ef4444', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

const UserIcon = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const KeyIcon = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="8" cy="15" r="5" />
    <Path d="M14.5 9.5 21 3m-3 0 3 3-3.5 3.5-3-3" />
  </Svg>
);

export default function LoginScreen({ onLoginSuccess, onBack, onCreateAccount }) {
  const { colors } = useTheme();
  const [selectedRole, setSelectedRole] = useState('landlord');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [msg, setMsg]                   = useState({ text: '', ok: false });
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchRole = (role) => {
    setSelectedRole(role);
    setMsg({ text: '', ok: false });
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
    setMsg({ text: '', ok: false });
    if (!email.trim() || !password) {
      setMsg({ text: 'Please enter your email and password.', ok: false });
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login(email.trim(), password, selectedRole);
      if (!response.token || !response.user) throw new Error('No token received. Please try again.');
      const returnedRole = response.user.role;
      if (returnedRole === 'host') {
        setMsg({ text: 'This account is an Accommodation Host. Please use the Accommodation portal.', ok: false });
        return;
      }
      if (returnedRole === 'user') {
        setMsg({ text: 'This account is a Business Owner. Please use the AxxBiashara portal.', ok: false });
        return;
      }
      if (returnedRole !== selectedRole) {
        setMsg({ text: `This account is not registered as a ${selectedRole}.`, ok: false });
        return;
      }
      await SecureStore.setItemAsync('token', response.token);
      onLoginSuccess(response.user);
    } catch (error) {
      setMsg({ text: error.message || 'Please check your credentials and try again.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back */}
          {onBack && (
            <TouchableOpacity style={s.backBtn} onPress={onBack}>
              <ArrowLeftIcon color={ACCENT} size={16} />
              <Text style={s.backText}>  All Portals</Text>
            </TouchableOpacity>
          )}

          {/* Brand */}
          <View style={s.brand}>
            <Image source={require('../../assets/axx-logo.jpg')} style={s.logoImage} resizeMode="contain" />
            <Text style={[s.brandName, { color: colors.text }]}>Property Manager</Text>
            <Text style={s.tagline}>Landlord & Caretaker Portal</Text>
            <View style={[s.pill, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
              <Text style={[s.pillText, { color: ACCENT }]}>Manage your properties and team</Text>
            </View>
          </View>

          {/* Role switcher */}
          <View style={[s.rolePill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Animated.View style={[s.roleSlider, {
              backgroundColor: ACCENT,
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

          {/* Inline message */}
          {msg.text ? (
            <View style={[s.msgBox, msg.ok ? s.msgOk : s.msgErr]}>
              <AlertIcon color={msg.ok ? '#1e3a5f' : '#ef4444'} size={14} />
              <Text style={s.msgText}> {msg.text}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Text style={s.label}>Email Address</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password */}
          <Text style={s.label}>Password</Text>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, s.pwInput]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity style={s.pwToggle} onPress={() => setShowPw(p => !p)}>
              {showPw
                ? <EyeOffIcon color={ACCENT} size={17} />
                : <EyeIcon color={ACCENT} size={17} />}
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity style={s.forgotLink} onPress={() => setShowForgotPassword(true)}>
            <Text style={[s.forgotText, { color: ACCENT }]}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnText}>Sign in as {selectedRole === 'landlord' ? 'Landlord' : 'Caretaker'}</Text>}
          </TouchableOpacity>

          {/* Create account */}
          {onCreateAccount && (
            <TouchableOpacity
              style={[s.note, { borderColor: ACCENT + '50', backgroundColor: ACCENT + '11' }]}
              onPress={onCreateAccount}
              activeOpacity={0.8}
            >
              <Text style={[s.noteText, { color: colors.textMuted }]}>
                Don't have an account?{'\n'}
                <Text style={{ color: ACCENT, fontWeight: '800' }}>Create Account →</Text>
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[s.footer, { color: colors.textMuted }]}>AxxSpaces — Property Manager Portal</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },

  backBtn: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.three, marginBottom: Spacing.two },
  backText: { fontSize: FontSize.sm, fontWeight: '700', color: ACCENT },

  brand: { alignItems: 'center', marginBottom: Spacing.four },
  logoImage: { width: 88, height: 88, borderRadius: 20, marginBottom: Spacing.two, backgroundColor: '#fff',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  brandName: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontSize: FontSize.sm, color: '#94a3b8', marginTop: 4, fontWeight: '600', letterSpacing: 0.3 },
  pill: { marginTop: 10, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Role switcher
  rolePill: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, marginBottom: Spacing.three, position: 'relative', height: 48 },
  roleSlider: { position: 'absolute', top: 4, bottom: 4, width: '48%', borderRadius: 10 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 },
  roleBtnText: { fontSize: FontSize.sm, fontWeight: '700' },

  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1 },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: '#374151', flex: 1 },

  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: Spacing.two },
  input: { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.md, color: colors.text },
  pwRow: { position: 'relative', justifyContent: 'center' },
  pwInput: { paddingRight: 48 },
  pwToggle: { position: 'absolute', right: 14 },

  forgotLink: { alignItems: 'flex-end', marginTop: 8, marginBottom: Spacing.two },
  forgotText: { fontSize: 13, fontWeight: '700' },

  btn: { backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.two,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.3 },

  note: { marginTop: Spacing.four, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center' },
  noteText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  footer: { textAlign: 'center', fontSize: FontSize.xs || 11, marginTop: Spacing.four, letterSpacing: 0.5 },
});
