import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Line, Circle, Rect } from 'react-native-svg';
import { propertyAPI, caretakerAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function InviteCaretakerScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Form fields
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [notes, setNotes]             = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Property assignment
  const [properties, setProperties]   = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);

  // Submit state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    propertyAPI
      .getMyProperties()
      .then(data => setProperties(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load properties:', err.message))
      .finally(() => setLoadingProps(false));
  }, []);

  const toggleProperty = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const validate = () => {
    if (!name.trim())  { Alert.alert('Missing info', 'Please enter the caretaker\'s full name.'); return false; }
    if (!email.trim()) { Alert.alert('Missing info', 'Please enter an email address.'); return false; }
    if (!phone.trim()) { Alert.alert('Missing info', 'Please enter a phone number.'); return false; }
    if (!password)     { Alert.alert('Missing info', 'Please set a password for the caretaker.'); return false; }
    if (password.length < 6) { Alert.alert('Weak password', 'Password must be at least 6 characters.'); return false; }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      Alert.alert('Weak password', 'Password must contain both letters and numbers.');
      return false;
    }
    if (password !== confirmPass) { Alert.alert('Password mismatch', 'Passwords do not match.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await caretakerAPI.inviteCaretaker(
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        password,
        selectedIds,
        notes.trim() || undefined,
      );
      Alert.alert(
        '✅ Caretaker Added',
        `${name.trim()} has been added successfully.\n\nThey can now log in with:\nEmail: ${email.trim().toLowerCase()}\nPassword: the one you set\n\nA welcome email has been sent to them.`,
        [{ text: 'Done', onPress: onBack }]
      );
    } catch (error) {
      Alert.alert('Failed to add caretaker', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Add Caretaker</Text>
          <Text style={styles.pageSubtitle}>
            Set up login credentials for your caretaker. They will receive a welcome email.
          </Text>

          {/* ── Personal Info ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Field label="Full Name" required>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Kamau"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </Field>

            <Field label="Email Address" required>
              <TextInput
                style={styles.input}
                placeholder="caretaker@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <Field label="Phone Number" required last>
              <TextInput
                style={styles.input}
                placeholder="07XXXXXXXX"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Field>
          </View>

          {/* ── Login Credentials ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Login Credentials</Text>
            <Text style={styles.sectionHint}>
              Set a password for the caretaker. Share it with them securely — they can change it later.
            </Text>

            <Field label="Password" required>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Min. 6 chars, letters + numbers"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass(v => !v)}
                >
                  <EyeIcon open={showPass} />
                </TouchableOpacity>
              </View>
            </Field>

            <Field label="Confirm Password" required last>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm(v => !v)}
                >
                  <EyeIcon open={showConfirm} />
                </TouchableOpacity>
              </View>
              {/* Password match indicator */}
              {confirmPass.length > 0 && (
                <Text style={password === confirmPass ? styles.matchOk : styles.matchErr}>
                  {password === confirmPass ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              )}
            </Field>
          </View>

          {/* ── Assign Properties ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign Properties <Text style={styles.optionalTag}>(Optional)</Text></Text>
            <Text style={styles.sectionHint}>Select which properties this caretaker will manage.</Text>

            {loadingProps ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.two }} />
            ) : properties.length === 0 ? (
              <Text style={styles.emptyText}>No properties found. You can assign them later.</Text>
            ) : (
              properties.map(p => {
                const selected = selectedIds.includes(p._id);
                return (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.propertyRow, selected && styles.propertyRowSelected]}
                    onPress={() => toggleProperty(p._id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <CheckIcon />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.propertyName, selected && styles.propertyNameSelected]}>
                        {p.title}
                      </Text>
                      {p.location && (
                        <Text style={styles.propertyLocation}>{p.location}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── Notes ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes <Text style={styles.optionalTag}>(Optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any special instructions or notes for this caretaker..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ── Summary banner ── */}
          {selectedIds.length > 0 && (
            <View style={styles.summaryBanner}>
              <ClipboardIcon color="#ef4444" />
              <Text style={[styles.summaryText, { marginLeft: 6 }]}>
                {selectedIds.length} propert{selectedIds.length === 1 ? 'y' : 'ies'} will be assigned
              </Text>
            </View>
          )}

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Add Caretaker</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── SVG Icon components (match project pattern from AgentIcons.js) ──
const svgBase = (size, color, sw = 1.8) => ({
  width: size, height: size, fill: 'none',
  stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
});

const EyeIcon = ({ open, size = 20, color = '#6b7280' }) => open ? (
  // Eye-off (hide)
  <Svg {...svgBase(size, color)} viewBox="0 0 24 24">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
) : (
  // Eye (show)
  <Svg {...svgBase(size, color)} viewBox="0 0 24 24">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const CheckIcon = ({ size = 14, color = '#fff' }) => (
  <Svg {...svgBase(size, color, 2.5)} viewBox="0 0 24 24">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const CheckSmallIcon = ({ size = 13, color = '#1e3a5f' }) => (
  <Svg {...svgBase(size, color, 2.5)} viewBox="0 0 24 24">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const XSmallIcon = ({ size = 13, color = '#ef4444' }) => (
  <Svg {...svgBase(size, color, 2.5)} viewBox="0 0 24 24">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const ClipboardIcon = ({ size = 16, color = '#6b7280' }) => (
  <Svg {...svgBase(size, color)} viewBox="0 0 24 24">
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </Svg>
);

// Helper component for labeled fields
function Field({ label, required, last, children }) {
  return (
    <View style={{ marginBottom: last ? 0 : Spacing.two + 4 }}>
      <Text style={fieldLabelStyle}>
        {label}
        {required && <Text style={{ color: '#ef4444' }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const fieldLabelStyle = {
  fontSize: 13,
  fontWeight: '600',
  color: '#6b7280',
  marginBottom: 6,
};

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.six + 20 },

  backBtn: { marginBottom: Spacing.three },
  backBtnText: { color: colors.primary, fontSize: FontSize.md, fontWeight: '600' },

  pageTitle: {
    fontSize: FontSize['3xl'] || 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.four,
    lineHeight: 20,
  },

  section: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.two,
  },
  sectionHint: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.two + 4,
    lineHeight: 18,
  },
  optionalTag: {
    fontWeight: '400',
    color: colors.textSecondary || '#9ca3af',
    fontSize: FontSize.sm,
  },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.two + 4,
    fontSize: FontSize.md,
    color: colors.text,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: Spacing.two,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  eyeBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  matchOk: { color: '#1e3a5f', fontSize: 12, fontWeight: '500' },
  matchErr: { color: '#ef4444', fontSize: 12, fontWeight: '500' },

  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.two,
    backgroundColor: colors.background,
  },
  propertyRowSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444415',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: Spacing.two + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  propertyName: { fontSize: FontSize.md, color: colors.text, fontWeight: '500' },
  propertyNameSelected: { color: '#ef4444', fontWeight: '600' },
  propertyLocation: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 },
  emptyText: { color: colors.textSecondary, fontSize: FontSize.sm, fontStyle: 'italic' },

  summaryBanner: {
    backgroundColor: '#ef444415',
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    marginBottom: Spacing.three,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  summaryText: { color: '#ef4444', fontWeight: '600', fontSize: FontSize.sm },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  cancelBtn: {
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  cancelBtnText: { color: colors.textSecondary, fontSize: FontSize.md },
});
