import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import ImageCropModal from '../../components/ImageCropModal';
import HelpCenterScreen from '../support/HelpCenterScreen';

const AGENT_TIPS = [
  {
    id: 'ag1',
    question: 'How do I upgrade my package?',
    answer: 'Go to Account → Upgrade Package. Choose the plan that fits your needs. Higher plans unlock more listings and premium features.',
  },
  {
    id: 'ag2',
    question: 'How do I add a new listing?',
    answer: 'From your Agent dashboard tap "Add Listing". Fill in the property details, set the price, upload photos and publish.',
  },
  {
    id: 'ag3',
    question: 'How do I generate a QR code for a listing?',
    answer: 'Open a listing and tap "Generate QR Poster". You can download and print the poster to place at the property.',
  },
  {
    id: 'ag4',
    question: 'How many listings can I have?',
    answer: 'The number of active listings depends on your package. Check Account → My Package to see your current limit and usage.',
  },
  {
    id: 'ag5',
    question: 'Why is my listing not showing to clients?',
    answer: 'Make sure the listing status is Published and not Draft. Also confirm your account is active and your package has not expired.',
  },
];
import { useTheme } from '../../context/ThemeContext';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, CameraIcon } from './AgentIcons';

/* ── Exact colors from AgentDashboard.jsx / AgentLogin.jsx ───────── */
const C = {
  rootBg: '#f8f4f0',
  white: '#ffffff',
  headerBorder: '#e5e7eb',
  logoAccent: '#e11d48',
  logoWord: '#1f2937',
  title: '#1f2937',
  subtitle: '#6b7280',
  label: '#374151',
  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
  inputBorder: '#e5e7eb',
  inputFocus: '#e11d48',
  // Buttons
  primaryBg: '#e11d48',
  primaryText: '#ffffff',
  logoutBg: '#fee2e2',
  logoutText: '#dc2626',
  // Status
  successBg: '#dbeafe',
  successText: '#1e3a5f',
  errorBg: '#fee2e2',
  errorText: '#dc2626',
  // Info rows
  infoLabel: '#6b7280',
  infoValue: '#1f2937',
  // Camera badge
  cameraBadgeBg: '#e11d48',
};

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
function resolveMediaUrl(url) {
  if (!url) return '';
  if (String(url).startsWith('http')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

function MsgBanner({ msg }) {
  if (!msg?.text) return null;
  const ok = msg.ok;
  return (
    <View style={[styles.msgBox, { backgroundColor: ok ? C.successBg : C.errorBg }]}>
      <Text style={{ color: ok ? C.successText : C.errorText, fontSize: 13 }}>{msg.text}</Text>
    </View>
  );
}

/* ── Change Password ─────────────────────────────────────────────── */
function ChangePasswordView({ onDone }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPw: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [focused, setFocused] = useState({});

  const handleSave = async () => {
    setMsg({ text: '', ok: false });
    if (!form.current || !form.newPw || !form.confirm) {
      setMsg({ text: 'All fields are required.', ok: false }); return;
    }
    if (form.newPw !== form.confirm) {
      setMsg({ text: 'New passwords do not match.', ok: false }); return;
    }
    if (form.newPw.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters.', ok: false }); return;
    }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const res = await fetch(`${API_BASE}/profile/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      setMsg({ text: 'Password changed successfully.', ok: true });
      setTimeout(onDone, 1200);
    } catch (err) {
      setMsg({ text: err.message || 'Failed. Check your current password.', ok: false });
    } finally { setLoading(false); }
  };

  return (
    <View>
      <TouchableOpacity style={styles.backRow} onPress={onDone} activeOpacity={0.7}>
        <ArrowLeftIcon color={C.subtitle} size={16} />
        <Text style={[styles.backText, { color: C.logoAccent }]}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Change Password</Text>
      <MsgBanner msg={msg} />

      {[
        { key: 'current', label: 'Current Password' },
        { key: 'newPw', label: 'New Password' },
      ].map(f => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[
                styles.input, styles.pwInput,
                focused[f.key] && styles.inputFocused,
              ]}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!show[f.key]}
              value={form[f.key]}
              onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
              onFocus={() => setFocused(p => ({ ...p, [f.key]: true }))}
              onBlur={() => setFocused(p => ({ ...p, [f.key]: false }))}
            />
            <TouchableOpacity
              style={styles.pwToggle}
              onPress={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
            >
              {show[f.key]
                ? <EyeOffIcon color={C.subtitle} size={17} />
                : <EyeIcon color={C.subtitle} size={17} />}
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.field}>
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={[styles.input, focused.confirm && styles.inputFocused]}
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={form.confirm}
          onChangeText={v => setForm(p => ({ ...p, confirm: v }))}
          onFocus={() => setFocused(p => ({ ...p, confirm: true }))}
          onBlur={() => setFocused(p => ({ ...p, confirm: false }))}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={C.primaryText} />
          : <Text style={styles.primaryBtnText}>Save Password</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

/* ── Edit Profile ────────────────────────────────────────────────── */
function EditProfileView({ user, onDone, onProfileUpdated }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.agentProfile?.phone || user?.phone || '');
  const [bio, setBio] = useState(user?.agentProfile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [focused, setFocused] = useState({});

  const handleSave = async () => {
    if (!name.trim()) { setMsg({ text: 'Name is required.', ok: false }); return; }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), bio: bio.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      setMsg({ text: 'Profile updated successfully.', ok: true });
      onProfileUpdated({ name: name.trim(), phone: phone.trim() });
      setTimeout(onDone, 1200);
    } catch (err) {
      setMsg({ text: err.message || 'Failed to update profile.', ok: false });
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'name', label: 'Full Name', value: name, set: setName, kb: 'default' },
    { key: 'phone', label: 'Phone Number', value: phone, set: setPhone, kb: 'phone-pad' },
  ];

  return (
    <View>
      <TouchableOpacity style={styles.backRow} onPress={onDone} activeOpacity={0.7}>
        <ArrowLeftIcon color={C.subtitle} size={16} />
        <Text style={[styles.backText, { color: C.logoAccent }]}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Edit Profile</Text>
      <MsgBanner msg={msg} />

      {fields.map(f => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={[styles.input, focused[f.key] && styles.inputFocused]}
            value={f.value}
            onChangeText={f.set}
            keyboardType={f.kb}
            placeholderTextColor="#9ca3af"
            onFocus={() => setFocused(p => ({ ...p, [f.key]: true }))}
            onBlur={() => setFocused(p => ({ ...p, [f.key]: false }))}
          />
        </View>
      ))}

      <View style={styles.field}>
        <Text style={styles.label}>Bio / Experience</Text>
        <TextInput
          style={[styles.input, styles.textArea, focused.bio && styles.inputFocused]}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#9ca3af"
          placeholder="Tell clients about your experience..."
          onFocus={() => setFocused(p => ({ ...p, bio: true }))}
          onBlur={() => setFocused(p => ({ ...p, bio: false }))}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={C.primaryText} />
          : <Text style={styles.primaryBtnText}>Save Profile</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

/* ── House Hunting Fee View ──────────────────────────────────────── */
function HouseHuntingFeeView({ user, onDone }) {
  const [fee, setFee] = useState(String(user?.agentProfile?.houseHuntingFee || ''));
  const [terms, setTerms] = useState(user?.agentProfile?.houseHuntingFeeTerms || 'Per viewing trip');
  const [offers, setOffers] = useState(user?.agentProfile?.offersHouseHunting !== false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const PRESETS = [500, 1000, 1500, 2000, 2500, 3000];

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const res = await fetch(`${API_BASE}/agents/house-hunting-fee`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          houseHuntingFee: Number(fee) || 0,
          houseHuntingFeeTerms: terms.trim(),
          offersHouseHunting: offers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setMsg({ text: 'House hunting fee saved!', ok: true });
      setTimeout(onDone, 1200);
    } catch (err) {
      setMsg({ text: err.message || 'Failed to save.', ok: false });
    } finally { setLoading(false); }
  };

  return (
    <View>
      <TouchableOpacity style={styles.backRow} onPress={onDone} activeOpacity={0.7}>
        <ArrowLeftIcon color={C.subtitle} size={16} />
        <Text style={[styles.backText, { color: C.logoAccent }]}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>House Hunting Fee</Text>
      <MsgBanner msg={msg} />

      {/* Toggle */}
      <View style={[styles.infoCard, { marginBottom: 16 }]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}
          onPress={() => setOffers(v => !v)}
          activeOpacity={0.8}
        >
          <View style={{
            width: 24, height: 24, borderRadius: 6, borderWidth: 2,
            borderColor: offers ? C.logoAccent : C.inputBorder,
            backgroundColor: offers ? C.logoAccent : C.white,
            justifyContent: 'center', alignItems: 'center',
          }}>
            {offers && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.title }}>Offer House Hunting Services</Text>
            <Text style={{ fontSize: 12, color: C.subtitle, marginTop: 2 }}>
              When on, your fee is shown to tenants looking in your area.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Fee amount */}
      <View style={styles.field}>
        <Text style={styles.label}>Fee Amount (KES)</Text>
        <TextInput
          style={[styles.input, !offers && { backgroundColor: '#f3f4f6' }]}
          value={fee}
          onChangeText={setFee}
          keyboardType="numeric"
          placeholder="e.g. 1000"
          placeholderTextColor="#9ca3af"
          editable={offers}
        />
        {/* Quick presets */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {PRESETS.map(amt => (
            <TouchableOpacity
              key={amt}
              onPress={() => offers && setFee(String(amt))}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                borderWidth: 1, borderColor: '#e5e7eb',
                backgroundColor: Number(fee) === amt ? C.title : '#f3f4f6',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: Number(fee) === amt ? '#fff' : '#374151' }}>
                KES {amt.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Terms */}
      <View style={styles.field}>
        <Text style={styles.label}>Fee Terms / Scope</Text>
        <TextInput
          style={[styles.input, !offers && { backgroundColor: '#f3f4f6' }]}
          value={terms}
          onChangeText={setTerms}
          placeholder="e.g. Per viewing trip (up to 4 houses)"
          placeholderTextColor="#9ca3af"
          editable={offers}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={C.primaryText} />
          : <Text style={styles.primaryBtnText}>Save Fee</Text>
        }
      </TouchableOpacity>
    </View>
  );
}


export default function AgentAccountScreen({ user, onLogout, onProfileUpdated, onUpgradePackage }) {
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const [view, setView] = useState('main');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(null);
  const [cropModal, setCropModal] = useState({ visible: false, uri: null, width: 0, height: 0 });

  const verified = user?.agentProfile?.verificationStatus === 'verified';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AG';
  const avatarSrc = localAvatar || (user?.profileImage ? resolveMediaUrl(user.profileImage) : null);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Allow access to your photo library.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!res.canceled && res.assets?.[0]) {
      const { uri, width, height } = res.assets[0];
      setCropModal({ visible: true, uri, width: width || 1000, height: height || 1000 });
    }
  };

  const uploadAvatar = async (uri) => {
    setLocalAvatar(uri);
    setUploadingAvatar(true);
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const form = new FormData();
      form.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' });
      const r = await fetch(`${API_BASE}/profile`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (r.ok) {
        const d = await r.json();
        if (d.data?.user?.profileImage) onProfileUpdated({ profileImage: d.data.user.profileImage });
      }
    } catch (err) { console.error('Avatar upload:', err); }
    finally { setUploadingAvatar(false); }
  };

  if (showHelpCenter) {
    return <HelpCenterScreen navigation={{ goBack: () => setShowHelpCenter(false) }} tips={AGENT_TIPS} />;
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Log out of the Agent Portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  const renderView = () => {
    if (view === 'changePassword') {
      return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            <ChangePasswordView onDone={() => setView('main')} />
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }
    if (view === 'editProfile') {
      return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            <EditProfileView
              user={user}
              onDone={() => setView('main')}
              onProfileUpdated={onProfileUpdated}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }
    if (view === 'huntingFee') {
      return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            <HouseHuntingFeeView user={user} onDone={() => setView('main')} />
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile card */}
        <View style={styles.profileSection}>
          {/* Avatar with camera badge */}
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
            {avatarSrc ? (
              <Image source={{ uri: avatarSrc }} style={styles.profileImg} />
            ) : (
              <View style={[styles.profileImg, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.profileImgText}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color={C.primaryText} />
                : <CameraIcon color={C.primaryText} size={13} />}
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileDetail}>{user?.email}</Text>
            {(user?.agentProfile?.county || user?.county) && (
              <Text style={styles.profileDetail}>
              {user.agentProfile?.county || user.county}
            </Text>
            )}
            {/* Verification badge */}
            <View style={[
              styles.verifiedBadge,
              { backgroundColor: verified ? C.successBg : '#dbeafe' }
            ]}>
              <Text style={{ color: verified ? C.successText : '#1e3a5f', fontSize: 11, fontWeight: '700' }}>
                {verified ? '✓ Verified Agent' : 'Pending Verification'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info rows — white card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Profile Info</Text>
          {[
            ['Name', user?.name],
            ['Email', user?.email],
            ['Phone', user?.agentProfile?.phone || user?.phone],
            ['County', user?.agentProfile?.county || user?.county],
            ['Bio', user?.agentProfile?.bio],
          ].map(([label, value]) =>
            value ? (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
              </View>
            ) : null
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.menuRow} onPress={() => setView('editProfile')} activeOpacity={0.7}>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <Text style={{ color: C.logoAccent, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => setView('changePassword')} activeOpacity={0.7}>
            <Text style={styles.menuLabel}>Change Password</Text>
            <Text style={{ color: C.logoAccent, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => setView('huntingFee')} activeOpacity={0.7}>
            <Text style={styles.menuLabel}>House Hunting Fee</Text>
            <Text style={{ color: C.logoAccent, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={toggleTheme} activeOpacity={0.7}>
            <Text style={styles.menuLabel}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
            <Text style={{ color: C.logoAccent, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => setShowHelpCenter(true)} activeOpacity={0.7}>
            <Text style={styles.menuLabel}>Help Center</Text>
            <Text style={{ color: C.logoAccent, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Upgrade Package button */}
        {onUpgradePackage && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={onUpgradePackage}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeBtnText}>Upgrade Package</Text>
          </TouchableOpacity>
        )}

        {/* Logout button — exact website style: #fee2e2 bg, #dc2626 text */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoAccent}>AXX</Text>
          <Text style={styles.logoWord}>SPACE</Text>
        </View>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>
      {renderView()}

      {/* Crop modal */}
      <ImageCropModal
        visible={cropModal.visible}
        imageUri={cropModal.uri}
        imageWidth={cropModal.width}
        imageHeight={cropModal.height}
        onDone={(uri) => {
          setCropModal({ visible: false, uri: null, width: 0, height: 0 });
          uploadAvatar(uri);
        }}
        onCancel={() => setCropModal({ visible: false, uri: null, width: 0, height: 0 })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.rootBg },

  header: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { flexDirection: 'row', alignItems: 'center' },
  logoAccent: { fontSize: 20, fontWeight: '900', color: C.logoAccent },
  logoWord: { fontSize: 20, fontWeight: '900', color: C.logoWord },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.title },

  container: { padding: 24, paddingBottom: 40 },

  /* Profile section */
  profileSection: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  avatarWrap: { position: 'relative' },
  profileImg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.logoAccent,
    borderWidth: 4, borderColor: C.white,
  },
  profileImgText: { color: C.white, fontSize: 26, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.cameraBadgeBg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: C.title, marginBottom: 4 },
  profileDetail: { fontSize: 14, color: C.subtitle, marginBottom: 4 },
  verifiedBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    alignSelf: 'flex-start', marginTop: 6,
  },

  /* Info card */
  infoCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 16, fontWeight: '700', color: C.title,
    padding: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.cardBorder,
  },
  infoLabel: { fontSize: 13, color: C.infoLabel, fontWeight: '600', flex: 1 },
  infoValue: { fontSize: 13, color: C.infoValue, flex: 2, textAlign: 'right' },

  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: C.cardBorder,
  },
  menuLabel: { fontSize: 14, fontWeight: '600', color: C.title },

  /* Upgrade Package button */
  upgradeBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

  /* Logout — matches website logoutBtn */
  logoutBtn: {
    backgroundColor: C.logoutBg,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { color: C.logoutText, fontSize: 13, fontWeight: '600' },

  /* Form styles — matching AgentLogin.jsx */
  sectionTitle: { fontSize: 22, fontWeight: '800', color: C.title, marginBottom: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: '600' },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: C.label, marginBottom: 6 },
  input: {
    padding: 12, borderWidth: 2, borderColor: C.inputBorder,
    borderRadius: 10, fontSize: 14, color: C.title, backgroundColor: C.white,
  },
  inputFocused: { borderColor: C.inputFocus },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 48 },
  pwToggle: { position: 'absolute', right: 14, top: 13, padding: 2 },

  primaryBtn: {
    backgroundColor: C.primaryBg, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { color: C.primaryText, fontSize: 16, fontWeight: '800' },

  msgBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
});
