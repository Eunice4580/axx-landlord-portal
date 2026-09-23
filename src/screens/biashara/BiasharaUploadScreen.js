import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { CheckIcon, AlertIcon } from './Icons';

const ACCENT = '#fbbf24';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

const CATEGORIES = [
  'Furniture','Electronics','Appliances','Tools','Clothing',
  'Books','Sports & Outdoors','Home & Garden','Beauty & Personal Care',
  'Toys & Games','Construction Materials','Vehicles & Parts','Other',
];

const CONDITIONS = ['Like New', 'Good', 'Fair', 'Poor'];

const COUNTIES = [
  'Nairobi City','Mombasa','Kisumu','Nakuru','Kiambu','Machakos',
  'Uasin Gishu','Meru','Kilifi','Kwale','Garissa','Kakamega',
  'Nyeri',"Murang'a",'Embu','Kericho','Bomet','Bungoma','Busia',
  'Siaya','Homa Bay','Migori','Kisii','Nyamira','Tana River',
  'Lamu','Taita Taveta','Wajir','Mandera','Marsabit','Isiolo',
  'Tharaka Nithi','Kitui','Makueni','Nyandarua','Kirinyaga',
  'Turkana','West Pokot','Samburu','Trans Nzoia','Elgeyo Marakwet',
  'Nandi','Baringo','Laikipia','Narok','Kajiado','Vihiga',
];

// ── Picker component — uses static styles ────────────────────────
function DropdownPicker({ label, value, options, onSelect, colors }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerBtn, {
          borderColor: value ? ACCENT + '60' : colors.border,
          backgroundColor: colors.backgroundElement,
        }]}
        onPress={() => setOpen(p => !p)}
      >
        <Text style={[styles.pickerBtnText, { color: value ? colors.text : colors.textMuted }]}>
          {value || `Select ${label}`}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>▾</Text>
      </TouchableOpacity>

      {open && (
        <View style={[styles.pickerDropdown, {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.border,
        }]}>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.pickerOption, { borderBottomColor: colors.border }]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, {
                  color: opt === value ? ACCENT : colors.text,
                  fontWeight: opt === value ? '700' : '400',
                }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────
export default function BiasharaUploadScreen({ onUploadSuccess }) {
  const { colors } = useTheme();

  const [form, setForm] = useState({
    title: '', description: '', category: '', condition: '',
    price: '', quantity: '', location: '', county: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isSuccess: false });

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages(result.assets.map((a, i) => ({
        uri: a.uri,
        name: a.fileName || `img_${Date.now()}_${i}.jpg`,
        type: a.mimeType || 'image/jpeg',
      })));
    }
  };

  const handleSubmit = async () => {
    setMsg({ text: '', isSuccess: false });
    const { title, description, category, price, quantity, location, county } = form;
    if (!title || !description || !category || !price || !quantity || !location || !county) {
      setMsg({ text: 'Please fill in all required fields.', isSuccess: false });
      return;
    }
    if (images.length === 0) {
      setMsg({ text: 'Please add at least one image.', isSuccess: false });
      return;
    }

    setLoading(true);

    const token = await SecureStore.getItemAsync('biashara_token');

    // Build FormData — text fields first, then image files
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
    images.forEach((img, idx) => {
      // React Native FormData expects this exact shape for file parts
      formData.append('images', {
        uri: img.uri,
        name: img.name || `image_${idx}.jpg`,
        type: img.type || 'image/jpeg',
      });
    });

    // Use XMLHttpRequest — it handles RN FormData file parts correctly.
    // (fetch throws "unsupported FormDataPart" in newer Expo SDK)
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/materials/create`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 40000; // 40 seconds

    xhr.onload = () => {
      setLoading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setMsg({ text: 'Listing uploaded! It goes live after admin review.', isSuccess: true });
          setForm({ title: '', description: '', category: '', condition: '', price: '', quantity: '', location: '', county: '' });
          setImages([]);
          setTimeout(() => { setMsg({ text: '', isSuccess: false }); onUploadSuccess?.(); }, 2500);
        } else {
          setMsg({ text: data.error || data.message || `Upload failed (${xhr.status}).`, isSuccess: false });
        }
      } catch {
        setMsg({ text: 'Unexpected server response. Please try again.', isSuccess: false });
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      setMsg({ text: 'Network error. Check your connection and try again.', isSuccess: false });
    };

    xhr.ontimeout = () => {
      setLoading(false);
      setMsg({ text: 'Request timed out. The server may be waking up — please try again in a moment.', isSuccess: false });
    };

    xhr.send(formData);
  };

  const inputStyle = [styles.input, {
    color: colors.text,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
  }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Listing</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Message banner */}
        {msg.text ? (
          <View style={[styles.msgBox, msg.isSuccess ? styles.msgSuccess : styles.msgError]}>
            {msg.isSuccess
              ? <CheckIcon color="#22c55e" size={15} />
              : <AlertIcon color="#ef4444" size={15} />}
            <Text style={styles.msgText}> {msg.text}</Text>
          </View>
        ) : null}

        <Text style={[styles.label, { color: colors.textSecondary }]}>MATERIAL TITLE *</Text>
        <TextInput style={inputStyle} placeholder="e.g. Office Chair, Laptop, Cement Bags"
          placeholderTextColor={colors.textMuted} value={form.title} onChangeText={v => update('title', v)} />

        <DropdownPicker label="CATEGORY *" value={form.category} options={CATEGORIES}
          onSelect={v => update('category', v)} colors={colors} />

        <DropdownPicker label="CONDITION" value={form.condition} options={CONDITIONS}
          onSelect={v => update('condition', v)} colors={colors} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>PRICE (KES) *</Text>
        <TextInput style={inputStyle} placeholder="e.g. 5000" placeholderTextColor={colors.textMuted}
          value={form.price} onChangeText={v => update('price', v)} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>QUANTITY *</Text>
        <TextInput style={inputStyle} placeholder="e.g. 1" placeholderTextColor={colors.textMuted}
          value={form.quantity} onChangeText={v => update('quantity', v)} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>SPECIFIC AREA *</Text>
        <TextInput style={inputStyle} placeholder="e.g. Westlands, Kilimani" placeholderTextColor={colors.textMuted}
          value={form.location} onChangeText={v => update('location', v)} />

        <DropdownPicker label="COUNTY *" value={form.county} options={COUNTIES}
          onSelect={v => update('county', v)} colors={colors} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>DESCRIPTION *</Text>
        <TextInput
          style={[inputStyle, styles.textarea]}
          placeholder="Describe your item in detail..."
          placeholderTextColor={colors.textMuted}
          value={form.description}
          onChangeText={v => update('description', v)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>IMAGES * (up to 5)</Text>
        <TouchableOpacity
          style={[styles.imagePickerBtn, { borderColor: ACCENT + '50', backgroundColor: ACCENT + '0d' }]}
          onPress={pickImages}
        >
          <Text style={[styles.imagePickerText, { color: ACCENT }]}>
            {images.length > 0
              ? `${images.length} image${images.length > 1 ? 's' : ''} selected — tap to change`
              : 'Tap to select images from gallery'}
          </Text>
        </TouchableOpacity>
        {images.length > 0 && (
          <Text style={[styles.imageNames, { color: colors.textMuted }]}>
            {images.map(i => i.name).join(', ')}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0f172a" size="small" />
            : <Text style={styles.submitBtnText}>Publish Listing</Text>}
        </TouchableOpacity>

        <View style={{ height: Spacing.six }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Static StyleSheet — no color values inside
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  scroll: { padding: Spacing.three },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: Spacing.two },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.base },
  textarea: { minHeight: 100, paddingTop: Spacing.two },
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three },
  pickerBtnText: { fontSize: FontSize.base, flex: 1 },
  pickerDropdown: { borderWidth: 1, borderRadius: BorderRadius.md, marginTop: 4, zIndex: 999, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  pickerOption: { paddingHorizontal: Spacing.three, paddingVertical: 12, borderBottomWidth: 0.5 },
  pickerOptionText: { fontSize: FontSize.base },
  imagePickerBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center', marginTop: 4 },
  imagePickerText: { fontSize: FontSize.base, fontWeight: '700' },
  imageNames: { fontSize: FontSize.sm, marginTop: 6, lineHeight: 18 },
  submitBtn: { backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.four },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#0f172a', fontSize: FontSize.md, fontWeight: '800' },
  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1 },
  msgSuccess: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgError: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: '#f1f5f9', flex: 1 },
});
