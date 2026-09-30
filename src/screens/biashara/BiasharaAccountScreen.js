import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { biasharaProfileAPI, biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  UserIcon, LogoutIcon, EyeIcon, EyeOffIcon,
  CheckIcon, AlertIcon, StoreIcon, ChevronRightIcon,
  ArrowLeftIcon, EditIcon, SunIcon, MoonIcon,
} from './Icons';

const ACCENT = '#fbbf24';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

const CATEGORIES = [
  'Furniture','Electronics','Appliances','Tools','Clothing',
  'Books','Sports & Outdoors','Home & Garden','Beauty & Personal Care',
  'Toys & Games','Construction Materials','Vehicles & Parts','Other',
];

// ── Helpers ───────────────────────────────────────────────────────
function MsgBanner({ msg }) {
  if (!msg.text) return null;
  return (
    <View style={[styles.msgBox, msg.isSuccess ? styles.msgSuccess : styles.msgError]}>
      {msg.isSuccess ? <CheckIcon color="#22c55e" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
      <Text style={styles.msgText}> {msg.text}</Text>
    </View>
  );
}

function Label({ text, colors }) {
  return <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{text}</Text>;
}

function Field({ label, colors, children }) {
  return (
    <View style={{ marginTop: Spacing.two }}>
      <Label text={label} colors={colors} />
      {children}
    </View>
  );
}

function InputBox({ colors, ...props }) {
  return (
    <TextInput
      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
      placeholderTextColor={colors.textMuted}
      {...props}
    />
  );
}

function SectionRow({ Icon, label, sub, onPress, danger, colors }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#ef444415' : ACCENT + '15' }]}>
        <Icon color={danger ? '#ef4444' : ACCENT} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: danger ? '#ef4444' : colors.text }]}>{label}</Text>
        {sub ? <Text style={[styles.menuSub, { color: colors.textMuted }]}>{sub}</Text> : null}
      </View>
      <ChevronRightIcon color={colors.border} size={16} />
    </TouchableOpacity>
  );
}

function FormButtons({ onCancel, onSave, loading, colors }) {
  return (
    <View style={styles.formBtns}>
      <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onCancel}>
        <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={onSave} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#0f172a" size="small" />
          : <Text style={styles.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ── Change Password ───────────────────────────────────────────────
function ChangePasswordView({ colors, onDone }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPw: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isSuccess: false });

  const handleSave = async () => {
    setMsg({ text: '', isSuccess: false });
    if (!form.current || !form.newPw || !form.confirm) { setMsg({ text: 'Fill in all fields.', isSuccess: false }); return; }
    if (form.newPw !== form.confirm) { setMsg({ text: 'New passwords do not match.', isSuccess: false }); return; }
    if (form.newPw.length < 6) { setMsg({ text: 'Password must be at least 6 characters.', isSuccess: false }); return; }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('biashara_token');
      const res = await fetch(`${API_BASE}/profile/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Failed (${res.status})`);
      setMsg({ text: 'Password changed successfully.', isSuccess: true });
      setTimeout(onDone, 1500);
    } catch (err) {
      setMsg({ text: err.message || 'Failed. Check your current password.', isSuccess: false });
    } finally { setLoading(false); }
  };

  const pwField = (key, label) => (
    <Field label={label} colors={colors}>
      <View style={styles.pwRow}>
        <InputBox colors={colors} style={[styles.input, styles.pwInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          placeholder={label} secureTextEntry={!show[key]}
          value={form[key]} onChangeText={v => setForm(p => ({ ...p, [key]: v }))} />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(p => ({ ...p, [key]: !p[key] }))}>
          {show[key] ? <EyeOffIcon color={ACCENT} size={16} /> : <EyeIcon color={ACCENT} size={16} />}
        </TouchableOpacity>
      </View>
    </Field>
  );

  return (
    <View style={[styles.formCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <Text style={[styles.formCardTitle, { color: colors.text }]}>Change Password</Text>
      <MsgBanner msg={msg} />
      {pwField('current', 'CURRENT PASSWORD')}
      {pwField('newPw', 'NEW PASSWORD')}
      <Field label="CONFIRM NEW PASSWORD" colors={colors}>
        <InputBox colors={colors} placeholder="Repeat new password" secureTextEntry
          value={form.confirm} onChangeText={v => setForm(p => ({ ...p, confirm: v }))} />
      </Field>
      <FormButtons onCancel={onDone} onSave={handleSave} loading={loading} colors={colors} />
    </View>
  );
}

// ── Edit Personal Profile ─────────────────────────────────────────
function EditProfileView({ user, colors, onDone, onProfileSaved }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [county, setCounty] = useState(user?.county || '');
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isSuccess: false });

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to change your profile picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleSave = () => {
    setMsg({ text: '', isSuccess: false });
    if (!name.trim()) { setMsg({ text: 'Name cannot be empty.', isSuccess: false }); return; }
    setLoading(true);

    SecureStore.getItemAsync('biashara_token').then(token => {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (phone.trim()) fd.append('phone', phone.trim());
      if (county.trim()) fd.append('county', county.trim());
      if (avatarUri) {
        fd.append('avatar', {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
      }

      // XHR correctly handles RN FormData file parts (fetch does not)
      const xhr = new XMLHttpRequest();
      xhr.open('PATCH', `${API_BASE}/profile`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 35000;

      xhr.onload = () => {
        setLoading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setMsg({ text: 'Profile updated successfully.', isSuccess: true });
            // Immediately update parent with new values — no waiting for server round-trip
            onProfileSaved?.(
              { name: name.trim(), phone: phone.trim(), county: county.trim() },
              avatarUri // local file URI shown instantly; server refresh replaces with CDN URL
            );
            setTimeout(onDone, 1500);
          } else {
            setMsg({ text: data.error || data.message || `Failed (${xhr.status}).`, isSuccess: false });
          }
        } catch {
          setMsg({ text: 'Unexpected server response.', isSuccess: false });
        }
      };
      xhr.onerror = () => { setLoading(false); setMsg({ text: 'Network error. Try again.', isSuccess: false }); };
      xhr.ontimeout = () => { setLoading(false); setMsg({ text: 'Timed out. Server waking up — try again.', isSuccess: false }); };
      xhr.send(fd);
    }).catch(() => {
      setLoading(false);
      setMsg({ text: 'Could not get auth token. Please log out and back in.', isSuccess: false });
    });
  };

  const avatarDisplay = avatarUri || user?.profileImage || user?.avatar;

  return (
    <View style={[styles.formCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <Text style={[styles.formCardTitle, { color: colors.text }]}>Edit Profile</Text>
      <MsgBanner msg={msg} />

      {/* Avatar picker */}
      <TouchableOpacity style={styles.avatarPickerRow} onPress={pickAvatar}>
        {avatarDisplay
          ? <Image source={{ uri: avatarDisplay }} style={styles.avatarPreview} />
          : <View style={[styles.avatarPlaceholder, { backgroundColor: ACCENT }]}>
              <Text style={styles.avatarInitialLg}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
            </View>}
        <View style={[styles.avatarEditBadge, { backgroundColor: ACCENT }]}>
          <UserIcon color="#0f172a" size={12} />
        </View>
        <Text style={[styles.avatarPickerHint, { color: colors.textMuted }]}>Tap to change photo</Text>
      </TouchableOpacity>

      <Field label="FULL NAME *" colors={colors}>
        <InputBox colors={colors} placeholder="Your full name" value={name} onChangeText={setName} />
      </Field>
      <Field label="PHONE NUMBER" colors={colors}>
        <InputBox colors={colors} placeholder="+254 7XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </Field>
      <Field label="COUNTY" colors={colors}>
        <InputBox colors={colors} placeholder="e.g. Nairobi City" value={county} onChangeText={setCounty} />
      </Field>

      <View style={[styles.readonlyRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.readonlyLabel, { color: colors.textMuted }]}>EMAIL (cannot change here)</Text>
        <Text style={[styles.readonlyValue, { color: colors.textSecondary }]}>{user?.email || '—'}</Text>
      </View>

      <FormButtons onCancel={onDone} onSave={handleSave} loading={loading} colors={colors} />
    </View>
  );
}

// ── Edit Business Profile ─────────────────────────────────────────
function EditBusinessView({ business, colors, onDone }) {
  const [form, setForm] = useState({
    name: business?.name || '',
    description: business?.description || '',
    yearEstablished: business?.yearEstablished?.toString() || '',
    employeeCount: business?.employeeCount || '',
    priceRange: business?.priceRange || '',
    location: {
      county: business?.location?.county || '',
      town: business?.location?.town || '',
      address: business?.location?.address || '',
    },
    contact: {
      phone: business?.contact?.phone || '',
      email: business?.contact?.email || '',
      website: business?.contact?.website || '',
    },
    socialMedia: {
      whatsapp: business?.socialMedia?.whatsapp || '',
      instagram: business?.socialMedia?.instagram || '',
      facebook: business?.socialMedia?.facebook || '',
    },
  });
  const [selectedCats, setSelectedCats] = useState(business?.categories || []);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isSuccess: false });

  const update = (section, key, val) =>
    setForm(p => ({ ...p, [section]: { ...p[section], [key]: val } }));

  const toggleCat = (cat) =>
    setSelectedCats(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat]);

  const handleSave = async () => {
    setMsg({ text: '', isSuccess: false });
    if (!form.name.trim()) { setMsg({ text: 'Business name cannot be empty.', isSuccess: false }); return; }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('biashara_token');
      const res = await fetch(`${API_BASE}/business/${business._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, categories: selectedCats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Failed (${res.status})`);
      setMsg({ text: 'Business updated successfully.', isSuccess: true });
      setTimeout(onDone, 1500);
    } catch (err) {
      setMsg({ text: err.message || 'Update failed. Try again.', isSuccess: false });
    } finally { setLoading(false); }
  };

  const inp = (value, onChangeText, placeholder, extra = {}) => (
    <InputBox colors={colors} placeholder={placeholder} value={value} onChangeText={onChangeText} {...extra} />
  );

  return (
    <View style={[styles.formCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <Text style={[styles.formCardTitle, { color: colors.text }]}>Edit Business Profile</Text>
      <MsgBanner msg={msg} />

      <Field label="BUSINESS NAME *" colors={colors}>
        {inp(form.name, v => setForm(p => ({ ...p, name: v })), 'Business name')}
      </Field>
      <Field label="DESCRIPTION" colors={colors}>
        {inp(form.description, v => setForm(p => ({ ...p, description: v })), 'Tell customers about your business…', { multiline: true, numberOfLines: 4, textAlignVertical: 'top', style: [styles.input, styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }] })}
      </Field>

      {/* Categories */}
      <Field label="CATEGORIES" colors={colors}>
        <View style={styles.catWrap}>
          {CATEGORIES.map(cat => {
            const sel = selectedCats.includes(cat);
            return (
              <TouchableOpacity key={cat}
                style={[styles.catChip, { borderColor: sel ? ACCENT : colors.border, backgroundColor: sel ? ACCENT + '20' : colors.background }]}
                onPress={() => toggleCat(cat)}>
                <Text style={[styles.catChipText, { color: sel ? ACCENT : colors.textMuted }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      {/* Location */}
      <Text style={[styles.subHeading, { color: colors.textSecondary }]}>LOCATION</Text>
      <Field label="COUNTY" colors={colors}>{inp(form.location.county, v => update('location', 'county', v), 'e.g. Nairobi City')}</Field>
      <Field label="TOWN / AREA" colors={colors}>{inp(form.location.town, v => update('location', 'town', v), 'e.g. Westlands')}</Field>
      <Field label="STREET ADDRESS" colors={colors}>{inp(form.location.address, v => update('location', 'address', v), 'e.g. Kimathi Street')}</Field>

      {/* Contact */}
      <Text style={[styles.subHeading, { color: colors.textSecondary }]}>CONTACT INFO</Text>
      <Field label="PHONE" colors={colors}>{inp(form.contact.phone, v => update('contact', 'phone', v), '+254 7XX XXX XXX', { keyboardType: 'phone-pad' })}</Field>
      <Field label="EMAIL" colors={colors}>{inp(form.contact.email, v => update('contact', 'email', v), 'business@email.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}</Field>
      <Field label="WEBSITE" colors={colors}>{inp(form.contact.website, v => update('contact', 'website', v), 'https://yoursite.com', { autoCapitalize: 'none' })}</Field>

      {/* Social */}
      <Text style={[styles.subHeading, { color: colors.textSecondary }]}>SOCIAL MEDIA</Text>
      <Field label="WHATSAPP" colors={colors}>{inp(form.socialMedia.whatsapp, v => update('socialMedia', 'whatsapp', v), '+254 7XX XXX XXX', { keyboardType: 'phone-pad' })}</Field>
      <Field label="INSTAGRAM" colors={colors}>{inp(form.socialMedia.instagram, v => update('socialMedia', 'instagram', v), '@handle or URL', { autoCapitalize: 'none' })}</Field>
      <Field label="FACEBOOK" colors={colors}>{inp(form.socialMedia.facebook, v => update('socialMedia', 'facebook', v), 'Page name or URL', { autoCapitalize: 'none' })}</Field>

      {/* Extra */}
      <Text style={[styles.subHeading, { color: colors.textSecondary }]}>ADDITIONAL INFO</Text>
      <Field label="YEAR ESTABLISHED" colors={colors}>{inp(form.yearEstablished, v => setForm(p => ({ ...p, yearEstablished: v })), 'e.g. 2018', { keyboardType: 'numeric' })}</Field>
      <Field label="EMPLOYEE COUNT" colors={colors}>{inp(form.employeeCount, v => setForm(p => ({ ...p, employeeCount: v })), 'e.g. 5-10')}</Field>
      <Field label="PRICE RANGE" colors={colors}>{inp(form.priceRange, v => setForm(p => ({ ...p, priceRange: v })), 'e.g. KES 500 - 5,000')}</Field>

      <FormButtons onCancel={onDone} onSave={handleSave} loading={loading} colors={colors} />
    </View>
  );
}

// ── Main Account Screen ───────────────────────────────────────────
export default function BiasharaAccountScreen({ user, onLogout, onProfileUpdated }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [view, setView] = useState('main');
  const [business, setBusiness] = useState(null);
  const [loadingBiz, setLoadingBiz] = useState(true);

  // Local copy of user — updated immediately on save so the Account tab
  // reflects the new name/avatar instantly, without waiting for a server refresh.
  const [localUser, setLocalUser] = useState(user);

  // When the parent BiasharaPortal re-fetches from server, sync down here
  useEffect(() => { setLocalUser(user); }, [user]);

  useEffect(() => {
    biasharaBusinessAPI.getMyBusiness()
      .then(res => setBusiness(res.business || res || null))
      .catch(() => {})
      .finally(() => setLoadingBiz(false));
  }, []);

  // Called by EditProfileView right after a successful XHR save.
  // Immediately reflects the typed name/phone and picked avatar URI.
  // Then triggers a background server refresh to get the real CDN URL.
  const handleProfileSaved = (updatedFields, localAvatarUri) => {
    setLocalUser(prev => ({
      ...prev,
      ...updatedFields,
      ...(localAvatarUri ? { profileImage: localAvatarUri, avatar: localAvatarUri } : {}),
    }));
    // Pass both fields and avatar URI up to the portal for instant cross-tab sync
    onProfileUpdated?.(updatedFields, localAvatarUri);
  };

  const displayName = localUser?.name || 'Business Owner';
  const email = localUser?.email || '';
  const avatarUrl = localUser?.profileImage || localUser?.avatar;

  const confirmLogout = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);

  const back = () => setView('main');

  const renderForm = () => {
    if (view === 'changePassword') return <ChangePasswordView colors={colors} onDone={back} />;
    if (view === 'editProfile') return (
      <EditProfileView
        user={localUser || user}
        colors={colors}
        onDone={back}
        onProfileSaved={handleProfileSaved}
      />
    );
    if (view === 'editBusiness') return <EditBusinessView business={business} colors={colors} onDone={back} />;
    return null;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header with back arrow when in a sub-view */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        {view !== 'main' ? (
          <TouchableOpacity onPress={back} style={styles.headerBack}>
            <ArrowLeftIcon color={ACCENT} size={18} />
          </TouchableOpacity>
        ) : <View style={styles.headerBack} />}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {view === 'main' ? 'Account' : view === 'editProfile' ? 'Edit Profile' : view === 'changePassword' ? 'Change Password' : 'Edit Business'}
        </Text>
        <View style={styles.headerBack} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Profile avatar block — always visible on main */}
          {view === 'main' && (
            <View style={styles.profileBlock}>
              <TouchableOpacity onPress={() => setView('editProfile')} style={{ alignItems: 'center' }}>
                {avatarUrl
                  ? <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  : <View style={[styles.avatar, { backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                    </View>}
                <View style={[styles.editBadge, { backgroundColor: ACCENT }]}>
                  <UserIcon color="#0f172a" size={10} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{email}</Text>
              <View style={[styles.portalTag, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
                <StoreIcon color={ACCENT} size={12} />
                <Text style={[styles.portalTagText, { color: ACCENT }]}> AxxBiashara Business Owner</Text>
              </View>
            </View>
          )}

          <View style={styles.body}>
            {/* Sub-view forms */}
            {view !== 'main' && renderForm()}

            {/* Main menu */}
            {view === 'main' && (
              <>
                {/* Appearance */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
                <View style={[styles.menuCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={[styles.menuRow, { borderBottomColor: 'transparent' }]}>
                    <View style={[styles.menuIcon, { backgroundColor: ACCENT + '15' }]}>
                      {isDark ? <MoonIcon color={ACCENT} size={18} /> : <SunIcon color={ACCENT} size={18} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, { color: colors.text }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                      <Text style={[styles.menuSub, { color: colors.textMuted }]}>Toggle app appearance</Text>
                    </View>
                    <Switch
                      value={isDark}
                      onValueChange={toggleTheme}
                      trackColor={{ false: '#94a3b8', true: ACCENT + '60' }}
                      thumbColor={isDark ? ACCENT : '#f1f5f9'}
                    />
                  </View>
                </View>

                {/* My Account */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MY ACCOUNT</Text>
                <View style={[styles.menuCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <SectionRow Icon={UserIcon} label="Edit Profile" sub="Name, phone, county, profile photo" onPress={() => setView('editProfile')} colors={colors} />
                  <SectionRow Icon={EyeOffIcon} label="Change Password" sub="Update your account password" onPress={() => setView('changePassword')} colors={colors} />
                </View>

                {/* My Business */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MY BUSINESS</Text>
                <View style={[styles.menuCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  {loadingBiz ? (
                    <View style={styles.menuRow}>
                      <ActivityIndicator color={ACCENT} size="small" />
                      <Text style={[styles.menuSub, { color: colors.textMuted, marginLeft: 10 }]}>Loading business…</Text>
                    </View>
                  ) : business ? (
                    <SectionRow
                      Icon={StoreIcon}
                      label="Edit Business Profile"
                      sub={`${business.name} — description, contact, hours, social`}
                      onPress={() => setView('editBusiness')}
                      colors={colors}
                    />
                  ) : (
                    <View style={styles.menuRow}>
                      <Text style={[styles.menuSub, { color: colors.textMuted }]}>No business listing linked to this account.</Text>
                    </View>
                  )}
                </View>

                {/* Session */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SESSION</Text>
                <View style={[styles.menuCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <SectionRow Icon={LogoutIcon} label="Sign Out" sub="Sign out from AxxBiashara" onPress={confirmLogout} danger colors={colors} />
                </View>
              </>
            )}
          </View>

          <View style={{ height: Spacing.six }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: 1 },
  headerBack: { width: 32 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  profileBlock: { alignItems: 'center', paddingVertical: Spacing.four },
  avatar: { width: 84, height: 84, borderRadius: 42, marginBottom: 4 },
  avatarInitial: { color: '#0f172a', fontSize: 30, fontWeight: '900' },
  editBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginTop: -12, marginLeft: 56 },
  profileName: { fontSize: FontSize['2xl'], fontWeight: '800', marginTop: 8, marginBottom: 2 },
  profileEmail: { fontSize: FontSize.sm, marginBottom: Spacing.two },
  portalTag: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  portalTagText: { fontSize: 11, fontWeight: '700' },
  body: { paddingHorizontal: Spacing.three },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: Spacing.three, marginBottom: 8 },
  menuCard: { borderWidth: 1, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.two },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderBottomWidth: 0.5 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { fontSize: FontSize.base, fontWeight: '700', marginBottom: 2 },
  menuSub: { fontSize: FontSize.sm },
  // Form styles
  formCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three, marginBottom: Spacing.three },
  formCardTitle: { fontSize: FontSize.xl, fontWeight: '800', marginBottom: Spacing.two },
  inputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.base },
  textarea: { minHeight: 90, paddingTop: Spacing.two },
  pwRow: { position: 'relative', justifyContent: 'center' },
  pwInput: { paddingRight: 46 },
  eyeBtn: { position: 'absolute', right: 14 },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: Spacing.three },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, padding: 13, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', fontSize: FontSize.base },
  saveBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: 13, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#0f172a', fontWeight: '800', fontSize: FontSize.base },
  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1 },
  msgSuccess: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgError: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: '#f1f5f9', flex: 1 },
  // Avatar picker
  avatarPickerRow: { alignItems: 'center', marginBottom: Spacing.two, position: 'relative' },
  avatarPreview: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarInitialLg: { color: '#0f172a', fontSize: 34, fontWeight: '900' },
  avatarEditBadge: { position: 'absolute', bottom: 20, right: '35%', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  avatarPickerHint: { fontSize: FontSize.sm, marginTop: 6 },
  readonlyRow: { marginTop: Spacing.two, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.two + 2 },
  readonlyLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  readonlyValue: { fontSize: FontSize.base },
  subHeading: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: Spacing.three, marginBottom: 4 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catChipText: { fontSize: 12, fontWeight: '600' },
});
