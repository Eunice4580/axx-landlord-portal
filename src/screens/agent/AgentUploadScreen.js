import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
  Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Line, X } from 'react-native-svg';

/* ── Exact colors from Upload.jsx on the website ────────────────────── */
const C = {
  rootBg:           '#f8f4f0',
  white:            '#ffffff',
  headerBorder:     '#e5e7eb',
  logoAccent:       '#fbbf24',
  logoWord:         '#1f2937',
  title:            '#1f2937',
  subtitle:         '#6b7280',
  label:            '#374151',
  inputBorder:      '#e5e7eb',
  inputFocus:       '#fbbf24',
  hint:             '#9ca3af',
  cardBorder:       '#e5e7eb',
  // Step indicator
  stepActiveBg:     '#fbbf24',
  stepActiveText:   '#1f2937',
  stepDoneBg:       '#10b981',
  stepDoneText:     '#ffffff',
  stepInactiveBg:   '#e5e7eb',
  stepInactiveText: '#6b7280',
  // Buttons
  primaryBg:        '#fbbf24',
  primaryText:      '#1f2937',
  secondaryBg:      '#e5e7eb',
  secondaryText:    '#4b5563',
  // Upload image area
  imgUploadBorder:  '#fbbf24',
  imgUploadBg:      '#fffbeb',
  imgUploadText:    '#d97706',
  // Amenity toggle
  amenityActive:    '#fbbf24',
  amenityActiveTxt: '#1f2937',
  // Error/success
  errorBg:          '#fee2e2',
  errorText:        '#dc2626',
  successBg:        '#dcfce7',
  successText:      '#166534',
};

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

const PROPERTY_TYPES = [
  'Bedsitter','Studio Apartment','1 Bedroom','2 Bedroom','3 Bedroom',
  '4+ Bedroom','Maisonette','Bungalow','Townhouse','Apartment Block',
  'Single Room','Shared Room','Hostel Room','Commercial Office',
  'Shop / Retail Space','Warehouse','Plot / Land','Furnished Apartment',
  'Unfurnished Apartment','Penthouse','Duplex',
];

const KENYA_COUNTIES = [
  'Mombasa','Kwale','Kilifi','Tana River','Lamu','Taita Taveta',
  'Garissa','Wajir','Mandera','Marsabit','Isiolo','Meru','Tharaka Nithi',
  'Embu','Kitui','Machakos','Makueni','Nyandarua','Nyeri','Kirinyaga',
  "Murang'a",'Kiambu','Turkana','West Pokot','Samburu','Trans Nzoia',
  'Uasin Gishu','Elgeyo Marakwet','Nandi','Baringo','Laikipia','Nakuru',
  'Narok','Kajiado','Kericho','Bomet','Kakamega','Vihiga','Bungoma',
  'Busia','Siaya','Kisumu','Homa Bay','Migori','Kisii','Nyamira','Nairobi City',
];

const AMENITIES_LIST = [
  'WiFi','Parking','AC/Cooler','Water Tank','Generator','Security Fence',
  'Balcony','TV','Refrigerator','Cooking Stove','Bed','Sofa','Dining Table',
  'Shower','Kitchen Cabinet','Wardrobes','Ceiling Fans','Lights',
  '24/7 Security','Swimming Pool','Gym','Garden','Workspace','Pet Friendly',
];

const STEPS = ['Basic Info', 'Details', 'Images', 'Amenities'];

/* ── Picker dropdown (generic) ────────────────────────────────────── */
function Picker({ label, value, options, onSelect, focused, onFocus, onBlur }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.pickerBtn, focused && styles.inputFocused]}
        onPress={() => { setOpen(v => !v); onFocus?.(); }}
        activeOpacity={0.8}
      >
        <Text style={{ color: value ? C.title : C.hint, fontSize: 14 }}>
          {value || `Select ${label.toLowerCase().replace(' *','')}`}
        </Text>
        <Text style={{ color: C.hint }}>▾</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {options.map(o => (
              <TouchableOpacity
                key={o}
                style={[styles.dropdownItem, value === o && styles.dropdownItemActive]}
                onPress={() => { onSelect(o); setOpen(false); onBlur?.(); }}
              >
                <Text style={[styles.dropdownItemText, value === o && { color: C.primaryBg, fontWeight: '700' }]}>
                  {o}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ── Step indicator ────────────────────────────────────────────────── */
function StepBar({ step }) {
  return (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <React.Fragment key={s}>
            <View style={[
              styles.stepCircle,
              done   && styles.stepDone,
              active && styles.stepActive,
            ]}>
              <Text style={[
                styles.stepCircleText,
                done   && { color: C.stepDoneText },
                active && { color: C.stepActiveText },
              ]}>
                {done ? '✓' : i + 1}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function AgentUploadScreen({ onBack, onSuccess }) {
  const [step, setStep]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [focused, setFocused] = useState({});
  const [images, setImages] = useState([]);   // { uri, name, type }[]

  const [form, setForm] = useState({
    title: '', propertyType: '', county: '', location: '',
    totalUnits: '1', description: '', price: '', deposit: '',
    bedrooms: '', bathrooms: '', bookedUnits: '0',
    leaseType: 'monthly', furnished: false,
    amenities: [],
  });
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  /* ── Validation per step ─────────────────────────────────────── */
  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) return 'Title is required';
      if (!form.propertyType) return 'Property type is required';
      if (!form.county) return 'County is required';
      if (!form.location.trim()) return 'Location is required';
      if (!form.totalUnits || Number(form.totalUnits) < 1) return 'Number of units must be at least 1';
    }
    if (step === 1) {
      if (!form.description.trim()) return 'Description is required';
      if (!form.price || Number(form.price) <= 0) return 'Price is required';
    }
    if (step === 2) {
      if (images.length === 0) return 'Please upload at least one image';
    }
    if (step === 3) {
      if (form.amenities.length === 0) return 'Select at least one amenity';
      if (!agreed) return 'Please agree to the listing terms';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const back = () => { setError(''); setStep(s => s - 1); };

  /* ── Pick images ─────────────────────────────────────────────── */
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Allow access to your photos'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.length) {
      const newImgs = res.assets.map((a, i) => ({
        uri:  a.uri,
        name: a.fileName || `photo_${Date.now()}_${i}.jpg`,
        type: a.mimeType || 'image/jpeg',
      }));
      setImages(prev => [...prev, ...newImgs].slice(0, 10));
    }
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  /* ── Amenity toggle ──────────────────────────────────────────── */
  const toggleAmenity = (a) => {
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]
    );
  };

  /* ── Submit — use XHR (fetch+FormData breaks in React Native for files) ── */
  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const fd = new FormData();

      // Append text fields
      fd.append('title',        form.title.trim());
      fd.append('propertyType', form.propertyType);
      fd.append('county',       form.county);
      fd.append('location',     form.location.trim());
      fd.append('totalUnits',   form.totalUnits);
      fd.append('description',  form.description.trim());
      fd.append('price',        form.price);
      fd.append('leaseType',    form.leaseType);
      fd.append('furnished',    form.furnished ? 'true' : 'false');
      if (form.deposit)     fd.append('deposit',     form.deposit);
      if (form.bedrooms)    fd.append('bedrooms',    form.bedrooms);
      if (form.bathrooms)   fd.append('bathrooms',   form.bathrooms);
      if (form.bookedUnits) fd.append('bookedUnits', form.bookedUnits);

      // Amenities — send as JSON string (backend can parse)
      fd.append('amenities', JSON.stringify(form.amenities));

      // Images — correct React Native format
      images.forEach((img) => {
        fd.append('images', {
          uri:  img.uri,
          name: img.name || 'photo.jpg',
          type: img.type || 'image/jpeg',
        });
      });

      // XHR — handles multipart/form-data files correctly in React Native
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/properties`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = () => {
          let response;
          try { response = JSON.parse(xhr.responseText); } catch { response = {}; }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(new Error(response.error || response.message || `Server error (${xhr.status})`));
          }
        };

        xhr.onerror   = () => reject(new Error('Network error — check your connection'));
        xhr.ontimeout = () => reject(new Error('Upload timed out — please try again'));
        xhr.timeout   = 60000; // 60s

        xhr.send(fd);
      });

      setSuccess('Property uploaded successfully! It is now pending review.');
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Render steps ─────────────────────────────────────────────── */
  const renderStep = () => {
    if (step === 0) return (
      <View>
        <Text style={styles.stepTitle}>Basic Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Property Title *</Text>
          <TextInput
            style={[styles.input, focused.title && styles.inputFocused]}
            placeholder="e.g. Modern 2BR Apartment in Westlands"
            placeholderTextColor={C.hint}
            value={form.title}
            onChangeText={v => set('title', v)}
            onFocus={() => setFocused(f => ({ ...f, title: true }))}
            onBlur={() => setFocused(f => ({ ...f, title: false }))}
          />
        </View>

        <Picker
          label="Property Type *"
          value={form.propertyType}
          options={PROPERTY_TYPES}
          onSelect={v => set('propertyType', v)}
          focused={focused.propertyType}
          onFocus={() => setFocused(f => ({ ...f, propertyType: true }))}
          onBlur={() => setFocused(f => ({ ...f, propertyType: false }))}
        />

        <Picker
          label="County *"
          value={form.county}
          options={KENYA_COUNTIES}
          onSelect={v => set('county', v)}
          focused={focused.county}
          onFocus={() => setFocused(f => ({ ...f, county: true }))}
          onBlur={() => setFocused(f => ({ ...f, county: false }))}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Location / Area *</Text>
          <TextInput
            style={[styles.input, focused.location && styles.inputFocused]}
            placeholder="e.g. Westlands, Nairobi"
            placeholderTextColor={C.hint}
            value={form.location}
            onChangeText={v => set('location', v)}
            onFocus={() => setFocused(f => ({ ...f, location: true }))}
            onBlur={() => setFocused(f => ({ ...f, location: false }))}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Total Units *</Text>
          <TextInput
            style={[styles.input, focused.totalUnits && styles.inputFocused]}
            placeholder="1"
            placeholderTextColor={C.hint}
            keyboardType="number-pad"
            value={form.totalUnits}
            onChangeText={v => set('totalUnits', v)}
            onFocus={() => setFocused(f => ({ ...f, totalUnits: true }))}
            onBlur={() => setFocused(f => ({ ...f, totalUnits: false }))}
          />
        </View>
      </View>
    );

    if (step === 1) return (
      <View>
        <Text style={styles.stepTitle}>Property Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textarea, focused.description && styles.inputFocused]}
            placeholder="Describe the property — layout, features, surroundings..."
            placeholderTextColor={C.hint}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={form.description}
            onChangeText={v => set('description', v)}
            onFocus={() => setFocused(f => ({ ...f, description: true }))}
            onBlur={() => setFocused(f => ({ ...f, description: false }))}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Price (KES) *</Text>
            <TextInput
              style={[styles.input, focused.price && styles.inputFocused]}
              placeholder="e.g. 25000"
              placeholderTextColor={C.hint}
              keyboardType="number-pad"
              value={form.price}
              onChangeText={v => set('price', v)}
              onFocus={() => setFocused(f => ({ ...f, price: true }))}
              onBlur={() => setFocused(f => ({ ...f, price: false }))}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Deposit (KES)</Text>
            <TextInput
              style={[styles.input, focused.deposit && styles.inputFocused]}
              placeholder="Optional"
              placeholderTextColor={C.hint}
              keyboardType="number-pad"
              value={form.deposit}
              onChangeText={v => set('deposit', v)}
              onFocus={() => setFocused(f => ({ ...f, deposit: true }))}
              onBlur={() => setFocused(f => ({ ...f, deposit: false }))}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Bedrooms</Text>
            <TextInput
              style={[styles.input, focused.bedrooms && styles.inputFocused]}
              placeholder="e.g. 2"
              placeholderTextColor={C.hint}
              keyboardType="number-pad"
              value={form.bedrooms}
              onChangeText={v => set('bedrooms', v)}
              onFocus={() => setFocused(f => ({ ...f, bedrooms: true }))}
              onBlur={() => setFocused(f => ({ ...f, bedrooms: false }))}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              style={[styles.input, focused.bathrooms && styles.inputFocused]}
              placeholder="e.g. 1"
              placeholderTextColor={C.hint}
              keyboardType="number-pad"
              value={form.bathrooms}
              onChangeText={v => set('bathrooms', v)}
              onFocus={() => setFocused(f => ({ ...f, bathrooms: true }))}
              onBlur={() => setFocused(f => ({ ...f, bathrooms: false }))}
            />
          </View>
        </View>

        <Picker
          label="Lease Type"
          value={form.leaseType}
          options={['monthly','yearly','daily','short-term']}
          onSelect={v => set('leaseType', v)}
          focused={focused.leaseType}
          onFocus={() => setFocused(f => ({ ...f, leaseType: true }))}
          onBlur={() => setFocused(f => ({ ...f, leaseType: false }))}
        />

        {/* Furnished toggle */}
        <View style={[styles.field, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <TouchableOpacity
            style={[styles.checkbox, form.furnished && styles.checkboxActive]}
            onPress={() => set('furnished', !form.furnished)}
          >
            {form.furnished && <Text style={{ color: C.primaryText, fontWeight: '800', fontSize: 12 }}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.label}>Furnished</Text>
        </View>
      </View>
    );

    if (step === 2) return (
      <View>
        <Text style={styles.stepTitle}>Images</Text>
        <Text style={[styles.hint, { marginBottom: 16 }]}>Add up to 10 photos of the property.</Text>

        <TouchableOpacity style={styles.imgUploadArea} onPress={pickImages} activeOpacity={0.8}>
          <Text style={styles.imgUploadIcon}>📷</Text>
          <Text style={styles.imgUploadText}>Tap to select photos</Text>
          <Text style={styles.imgUploadHint}>JPG, PNG — up to 10 photos</Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <View style={styles.imgGrid}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imgItem}>
                <Image source={{ uri: img.uri }} style={styles.imgThumb} resizeMode="cover" />
                <TouchableOpacity style={styles.imgRemove} onPress={() => removeImage(idx)}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );

    if (step === 3) return (
      <View>
        <Text style={styles.stepTitle}>Amenities & Terms</Text>
        <Text style={[styles.hint, { marginBottom: 16 }]}>Select all that apply.</Text>

        <View style={styles.amenitiesGrid}>
          {AMENITIES_LIST.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.amenityChip, form.amenities.includes(a) && styles.amenityChipActive]}
              onPress={() => toggleAmenity(a)}
              activeOpacity={0.7}
            >
              <Text style={[styles.amenityChipText, form.amenities.includes(a) && styles.amenityChipTextActive]}>
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Terms */}
        <TouchableOpacity
          style={[styles.field, { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20 }]}
          onPress={() => setAgreed(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed && <Text style={{ color: C.primaryText, fontWeight: '800', fontSize: 12 }}>✓</Text>}
          </View>
          <Text style={[styles.hint, { flex: 1, lineHeight: 18 }]}>
            I confirm the property information is accurate and I agree to AXXSpace's listing terms. The listing will be reviewed before going live.
          </Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>Upload Property</Text>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Text style={{ color: C.logoAccent, fontWeight: '700', fontSize: 14 }}>✕</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Step bar */}
          <StepBar step={step} />
          <Text style={styles.stepLabel}>{STEPS[step]}</Text>

          {/* Error / Success */}
          {!!error   && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          {!!success && <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View>}

          {/* Step content */}
          <View style={styles.card}>
            {renderStep()}
          </View>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            {step > 0 ? (
              <TouchableOpacity style={styles.secondaryBtn} onPress={back} activeOpacity={0.8}>
                <Text style={styles.secondaryBtnText}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {step < STEPS.length - 1 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={next} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color={C.primaryText} />
                  : <Text style={styles.primaryBtnText}>Submit Listing</Text>
                }
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.rootBg },

  header: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo:        { flexDirection: 'row', alignItems: 'center' },
  logoAccent:  { fontSize: 18, fontWeight: '900', color: C.logoAccent },
  logoWord:    { fontSize: 18, fontWeight: '900', color: C.logoWord },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.title },

  container: { padding: 20, paddingBottom: 40 },

  /* Step bar */
  stepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.stepInactiveBg,
    justifyContent: 'center', alignItems: 'center',
  },
  stepActive:      { backgroundColor: C.stepActiveBg },
  stepDone:        { backgroundColor: C.stepDoneBg },
  stepCircleText:  { fontSize: 13, fontWeight: '700', color: C.stepInactiveText },
  stepLine:        { flex: 1, height: 2, backgroundColor: C.stepInactiveBg, marginHorizontal: 4 },
  stepLineDone:    { backgroundColor: C.stepDoneBg },
  stepLabel:       { textAlign: 'center', fontSize: 13, fontWeight: '600', color: C.subtitle, marginBottom: 16 },

  /* Error / success */
  errorBox:   { backgroundColor: C.errorBg,   borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText:  { color: C.errorText,  fontSize: 13 },
  successBox: { backgroundColor: C.successBg, borderRadius: 8, padding: 12, marginBottom: 14 },
  successText:{ color: C.successText, fontSize: 13 },

  /* Card */
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepTitle: { fontSize: 18, fontWeight: '800', color: C.title, marginBottom: 20 },

  /* Form fields */
  field:       { marginBottom: 18 },
  row:         { flexDirection: 'row', gap: 12 },
  label:       { fontSize: 13, fontWeight: '700', color: C.label, marginBottom: 6 },
  hint:        { fontSize: 12, color: C.hint },
  input:       { padding: 12, borderWidth: 2, borderColor: C.inputBorder, borderRadius: 10, fontSize: 14, color: C.title, backgroundColor: C.white },
  inputFocused:{ borderColor: C.inputFocus },
  textarea:    { minHeight: 120, textAlignVertical: 'top' },

  pickerBtn:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown:    {
    borderWidth: 2, borderColor: C.inputFocus, borderRadius: 10, marginTop: 4,
    backgroundColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    zIndex: 999,
  },
  dropdownItem:      { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: C.inputBorder },
  dropdownItemActive:{ backgroundColor: '#fffbeb' },
  dropdownItemText:  { fontSize: 14, color: C.title },

  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.inputBorder,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: C.primaryBg, borderColor: C.primaryBg },

  /* Images */
  imgUploadArea: {
    borderWidth: 2, borderColor: C.imgUploadBorder, borderStyle: 'dashed',
    borderRadius: 12, backgroundColor: C.imgUploadBg,
    padding: 30, alignItems: 'center', marginBottom: 16,
  },
  imgUploadIcon: { fontSize: 32, marginBottom: 8 },
  imgUploadText: { fontSize: 15, fontWeight: '700', color: C.imgUploadText, marginBottom: 4 },
  imgUploadHint: { fontSize: 12, color: C.hint },

  imgGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imgItem:  { position: 'relative', width: 90, height: 90 },
  imgThumb: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#f1f5f9' },
  imgRemove:{
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.errorText,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Amenities */
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: C.inputBorder,
    backgroundColor: C.white,
  },
  amenityChipActive:    { backgroundColor: C.primaryBg, borderColor: C.primaryBg },
  amenityChipText:      { fontSize: 13, color: C.subtitle, fontWeight: '600' },
  amenityChipTextActive:{ color: C.primaryText },

  /* Navigation */
  navRow:       { flexDirection: 'row', gap: 12 },
  primaryBtn:   { flex: 1, backgroundColor: C.primaryBg, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText:{ color: C.primaryText, fontSize: 15, fontWeight: '800' },
  secondaryBtn: { flex: 1, backgroundColor: C.secondaryBg, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText:{ color: C.secondaryText, fontSize: 15, fontWeight: '600' },
});
