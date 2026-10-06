import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { EyeIcon, EyeOffIcon } from './AgentIcons';

/* ── Exact colors from AgentRegister.jsx on the website ────────────── */
const C = {
  bgGradientEnd:    '#fde68a',
  white:            '#ffffff',
  logoAccent:       '#fbbf24',
  logoWord:         '#1f2937',
  title:            '#1f2937',
  subtitle:         '#6b7280',
  label:            '#374151',
  inputBorder:      '#e5e7eb',
  inputFocusBorder: '#fbbf24',
  hint:             '#9ca3af',
  btnBg:            '#fbbf24',
  btnText:          '#1f2937',
  errorBg:          '#fee2e2',
  errorText:        '#dc2626',
  successBg:        '#dcfce7',
  successText:      '#16a34a',
  linkText:         '#fbbf24',
  linkGray:         '#6b7280',
};

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

const KENYA_COUNTIES = [
  'Mombasa','Kwale','Kilifi','Tana River','Lamu','Taita Taveta',
  'Garissa','Wajir','Mandera','Marsabit','Isiolo','Meru','Tharaka Nithi',
  'Embu','Kitui','Machakos','Makueni','Nyandarua','Nyeri','Kirinyaga',
  "Murang'a",'Kiambu','Turkana','West Pokot','Samburu','Trans Nzoia',
  'Uasin Gishu','Elgeyo Marakwet','Nandi','Baringo','Laikipia','Nakuru',
  'Narok','Kajiado','Kericho','Bomet','Kakamega','Vihiga','Bungoma',
  'Busia','Siaya','Kisumu','Homa Bay','Migori','Kisii','Nyamira','Nairobi City',
];

export default function AgentRegisterScreen({ onRegisterSuccess, onBack }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', county: '', bio: '',
  });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [focused, setFocused]   = useState({});
  const [showCountyPicker, setShowCountyPicker] = useState(false);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() ||
        !form.password || !form.county || !form.bio.trim()) {
      return 'Please fill in all fields';
    }
    if (form.password.length < 6) return 'Password must be at least 6 characters long';
    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      return 'Password must contain a mixture of both letters and numbers';
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      // Register
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'agent' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto-login
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.token) {
        await SecureStore.setItemAsync('agent_token', loginData.token);
        setSuccess('Registration successful! Taking you to your dashboard...');
        setTimeout(() => onRegisterSuccess(loginData.user), 1500);
      } else {
        setSuccess('Registration successful! Please log in.');
        setTimeout(() => onBack(), 2000);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>

              {/* Logo */}
              <View style={styles.logo}>
                <Text style={styles.logoAccent}>AXX</Text>
                <Text style={styles.logoWord}>SPACE</Text>
              </View>

              <Text style={styles.title}>Agent Registration</Text>
              <Text style={styles.subtitle}>
                Create your agent account to connect with accommodation providers
              </Text>

              {!!error   && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
              {!!success && <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View>}

              {/* Full Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, focused.name && styles.inputFocused]}
                  placeholder="Your full name"
                  placeholderTextColor={C.hint}
                  value={form.name}
                  onChangeText={v => set('name', v)}
                  onFocus={() => setFocused(f => ({ ...f, name: true }))}
                  onBlur={() => setFocused(f => ({ ...f, name: false }))}
                />
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, focused.email && styles.inputFocused]}
                  placeholder="your@email.com"
                  placeholderTextColor={C.hint}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={v => set('email', v)}
                  onFocus={() => setFocused(f => ({ ...f, email: true }))}
                  onBlur={() => setFocused(f => ({ ...f, email: false }))}
                />
              </View>

              {/* Phone */}
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, focused.phone && styles.inputFocused]}
                  placeholder="e.g. 0712 345 678"
                  placeholderTextColor={C.hint}
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={v => set('phone', v)}
                  onFocus={() => setFocused(f => ({ ...f, phone: true }))}
                  onBlur={() => setFocused(f => ({ ...f, phone: false }))}
                />
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.pwWrap}>
                  <TextInput
                    style={[styles.input, styles.pwInput, focused.password && styles.inputFocused]}
                    placeholder="••••••••"
                    placeholderTextColor={C.hint}
                    secureTextEntry={!showPw}
                    value={form.password}
                    onChangeText={v => set('password', v)}
                    onFocus={() => setFocused(f => ({ ...f, password: true }))}
                    onBlur={() => setFocused(f => ({ ...f, password: false }))}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                    {showPw ? <EyeOffIcon color={C.hint} size={18} /> : <EyeIcon color={C.hint} size={18} />}
                  </TouchableOpacity>
                </View>
                <Text style={styles.hint}>Must be at least 6 characters with letters and numbers</Text>
              </View>

              {/* County picker */}
              <View style={styles.field}>
                <Text style={styles.label}>County of Operation *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerBtn, focused.county && styles.inputFocused]}
                  onPress={() => setShowCountyPicker(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: form.county ? C.title : C.hint, fontSize: 14 }}>
                    {form.county || 'Select county...'}
                  </Text>
                  <Text style={{ color: C.hint }}>▾</Text>
                </TouchableOpacity>
                {showCountyPicker && (
                  <View style={styles.countyDropdown}>
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                      {KENYA_COUNTIES.map(c => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.countyItem, form.county === c && styles.countyItemSelected]}
                          onPress={() => { set('county', c); setShowCountyPicker(false); }}
                        >
                          <Text style={[styles.countyItemText, form.county === c && { color: C.btnBg, fontWeight: '700' }]}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Bio */}
              <View style={styles.field}>
                <Text style={styles.label}>Bio / Experience *</Text>
                <TextInput
                  style={[styles.input, styles.textarea, focused.bio && styles.inputFocused]}
                  placeholder="Tell us about your experience in the rental market, areas you specialize in, and what makes you a great agent..."
                  placeholderTextColor={C.hint}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={form.bio}
                  onChangeText={v => set('bio', v)}
                  onFocus={() => setFocused(f => ({ ...f, bio: true }))}
                  onBlur={() => setFocused(f => ({ ...f, bio: false }))}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color={C.btnText} />
                  : <Text style={styles.buttonText}>Create Agent Account</Text>
                }
              </TouchableOpacity>

              {/* Links */}
              <View style={styles.linkRow}>
                <Text style={styles.linkGray}>Already have an account? </Text>
                <TouchableOpacity onPress={onBack}>
                  <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bgGradientEnd },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 30 },

  container: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 8,
  },

  logo:       { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  logoAccent: { fontSize: 28, fontWeight: '800', color: C.logoAccent },
  logoWord:   { fontSize: 28, fontWeight: '800', color: C.logoWord },

  title:    { fontSize: 24, fontWeight: '800', color: C.title, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.subtitle, textAlign: 'center', marginBottom: 28 },

  errorBox:    { backgroundColor: C.errorBg,   borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText:   { color: C.errorText,  fontSize: 13 },
  successBox:  { backgroundColor: C.successBg, borderRadius: 8, padding: 12, marginBottom: 16 },
  successText: { color: C.successText, fontSize: 13 },

  field:       { marginBottom: 20 },
  label:       { fontSize: 13, fontWeight: '700', color: C.label, marginBottom: 6 },
  input:       { padding: 12, borderWidth: 2, borderColor: C.inputBorder, borderRadius: 10, fontSize: 14, color: C.title, backgroundColor: C.white },
  inputFocused:{ borderColor: C.inputFocusBorder },
  textarea:    { minHeight: 120, textAlignVertical: 'top' },
  hint:        { fontSize: 11, color: C.hint, marginTop: 4 },

  pwWrap:  { position: 'relative' },
  pwInput: { paddingRight: 48 },
  eyeBtn:  { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },

  pickerBtn:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countyDropdown: {
    borderWidth: 2, borderColor: C.inputFocusBorder, borderRadius: 10,
    marginTop: 4, backgroundColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  countyItem:         { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: C.inputBorder },
  countyItemSelected: { backgroundColor: '#fffbeb' },
  countyItemText:     { fontSize: 14, color: C.title },

  button:     { backgroundColor: C.btnBg, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: C.btnText, fontSize: 16, fontWeight: '800' },

  linkRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkGray:   { fontSize: 13, color: C.linkGray },
  linkText:   { fontSize: 13, color: C.linkText, fontWeight: '600' },
});
