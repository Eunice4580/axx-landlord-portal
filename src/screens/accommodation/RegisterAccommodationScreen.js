import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ArrowLeftIcon, CheckIcon, AlertIcon, PlusIcon, TrashIcon, CameraIcon } from './AccomIcons';

const ACCENT = '#10b981';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

const CATEGORIES = [
  'Hotel', 'Airbnb', 'Beach Resort', 'Mountain Lodge', 'Safari Camp',
  'Camping Grounds', 'Boutique Hotel', 'Eco Lodge', 'Guest House',
  'Bed & Breakfast', 'Hostel', 'Apartment', 'Villa', 'Holiday Home', 'Cottage',
];

const CATEGORY_MAP = {
  'Hotel': 'hotel',
  'Airbnb': 'bnb',
  'Beach Resort': 'beach-resort',
  'Mountain Lodge': 'mountain-lodge',
  'Safari Camp': 'safari-camp',
  'Camping Grounds': 'camping-grounds',
  'Boutique Hotel': 'boutique-hotel',
  'Eco Lodge': 'eco-lodge',
  'Guest House': 'guesthouse',
  'Bed & Breakfast': 'bnb',
  'Hostel': 'hostel',
  'Apartment': 'apartment',
  'Villa': 'villa',
  'Holiday Home': 'holiday-home',
  'Cottage': 'cottage',
};

const COUNTIES = [
  'Nairobi City', 'Mombasa', 'Kilifi', 'Kwale', 'Nakuru', 'Kiambu',
  'Kajiado', 'Machakos', 'Kisumu', 'Uasin Gishu', 'Meru', 'Nyeri',
  'Laikipia', 'Narok', 'Baringo', 'Lamu', 'Taita Taveta', 'Embu',
  'Murang\'a', 'Kirinyaga', 'Nyandarua', 'Kakamega', 'Bungoma', 'Siaya',
  'Homa Bay', 'Migori', 'Kisii', 'Kericho', 'Bomet', 'Nandi',
  'Trans Nzoia', 'West Pokot', 'Turkana', 'Samburu', 'Isiolo',
  'Marsabit', 'Garissa', 'Wajir', 'Mandera', 'Kitui', 'Makueni',
  'Tana River', 'Elgeyo Marakwet', 'Nyamira', 'Vihiga', 'Busia', 'Tharaka Nithi'
];

const AMENITIES = [
  'WiFi', 'Swimming Pool', 'Air Conditioning', 'Free Parking', 'Kitchen',
  'Ocean View', 'Breakfast Included', 'Gym', 'TV', 'Pet Friendly',
  'Restaurant', '24/7 Security', 'Room Service', 'Bar / Lounge', 'Hot Tub', 'Garden'
];

export default function RegisterAccommodationScreen({ itemToEdit, onBack, onSuccess }) {
  const { colors } = useTheme();
  const isEditing = !!itemToEdit;

  const [name, setName] = useState(itemToEdit?.name || '');
  const [category, setCategory] = useState(itemToEdit?.category || itemToEdit?.type ? (
    Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === itemToEdit?.type) || 'Hotel'
  ) : 'Hotel');
  const [description, setDescription] = useState(itemToEdit?.description || '');
  const [county, setCounty] = useState(itemToEdit?.location?.county || itemToEdit?.county || 'Nairobi City');
  const [town, setTown] = useState(itemToEdit?.location?.town || itemToEdit?.town || '');
  const [address, setAddress] = useState(itemToEdit?.location?.address || itemToEdit?.address || '');
  const [basePrice, setBasePrice] = useState(itemToEdit?.pricing?.basePrice ? String(itemToEdit.pricing.basePrice) : (itemToEdit?.basePrice ? String(itemToEdit.basePrice) : ''));
  const [totalRooms, setTotalRooms] = useState(itemToEdit?.totalRooms ? String(itemToEdit.totalRooms) : '1');
  const [maxGuests, setMaxGuests] = useState(itemToEdit?.maxGuests ? String(itemToEdit.maxGuests) : '2');
  const [bookingUrl, setBookingUrl] = useState(itemToEdit?.bookingUrl || '');
  const [selectedAmenities, setSelectedAmenities] = useState(
    Array.isArray(itemToEdit?.amenities) ? itemToEdit.amenities : []
  );
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState(itemToEdit?.images || []);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const toggleAmenity = (a) => {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload property photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uris = result.assets.map(a => a.uri);
      setNewImages(prev => [...prev, ...uris].slice(0, 15));
    }
  };

  const removeNewImage = (idx) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setMsg({ text: '', ok: false });
    if (!name.trim()) { setMsg({ text: 'Property name is required.', ok: false }); return; }
    if (!description.trim()) { setMsg({ text: 'Description is required.', ok: false }); return; }
    if (!town.trim()) { setMsg({ text: 'Town / Area is required.', ok: false }); return; }
    if (!address.trim()) { setMsg({ text: 'Address is required.', ok: false }); return; }
    if (!basePrice.trim()) { setMsg({ text: 'Base price per night is required.', ok: false }); return; }
    if (!isEditing && newImages.length === 0) {
      setMsg({ text: 'Please add at least one property photo.', ok: false });
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync('accom_token');
      if (!token) throw new Error('You must be logged in to register a property.');

      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('type', CATEGORY_MAP[category] || 'hotel');
      fd.append('category', category);
      fd.append('description', description.trim());
      fd.append('county', county.trim());
      fd.append('town', town.trim());
      fd.append('address', address.trim());
      fd.append('lat', String(itemToEdit?.location?.coordinates?.[1] || itemToEdit?.lat || -1.286389));
      fd.append('lng', String(itemToEdit?.location?.coordinates?.[0] || itemToEdit?.lng || 36.817223));
      fd.append('basePrice', basePrice.trim());
      fd.append('totalRooms', totalRooms.trim() || '1');
      fd.append('maxGuests', maxGuests.trim() || '2');
      if (bookingUrl.trim()) fd.append('bookingUrl', bookingUrl.trim());
      fd.append('amenities', JSON.stringify(selectedAmenities));

      newImages.forEach((uri, i) => {
        const ext = uri.split('.').pop() || 'jpg';
        fd.append('images', {
          uri,
          name: `property_${Date.now()}_${i}.${ext}`,
          type: 'image/jpeg',
        });
      });

      const url = isEditing
        ? `${API_BASE}/accommodations/${itemToEdit._id}`
        : `${API_BASE}/accommodations`;
      const method = isEditing ? 'PATCH' : 'POST';

      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 60000;

      xhr.onload = () => {
        setLoading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setMsg({
              text: isEditing ? 'Property updated successfully!' : 'Property registered successfully!',
              ok: true,
            });
            setTimeout(() => {
              onSuccess?.();
              onBack?.();
            }, 1200);
          } else {
            setMsg({ text: data.error || data.message || `Submission failed (${xhr.status})`, ok: false });
          }
        } catch {
          setMsg({ text: 'Unexpected response from server.', ok: false });
        }
      };

      xhr.onerror = () => {
        setLoading(false);
        setMsg({ text: 'Network connection error. Please try again.', ok: false });
      };

      xhr.ontimeout = () => {
        setLoading(false);
        setMsg({ text: 'Request timed out while uploading images.', ok: false });
      };

      xhr.send(fd);
    } catch (err) {
      setLoading(false);
      setMsg({ text: err.message || 'Failed to submit property.', ok: false });
    }
  };

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ArrowLeftIcon color={ACCENT} size={18} />
          <Text style={s.backBtnText}> Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Edit Property' : 'List Your Property'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {msg.text ? (
            <View style={[s.msgBox, msg.ok ? s.msgOk : s.msgErr]}>
              {msg.ok ? <CheckIcon color="#22c55e" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
              <Text style={s.msgText}> {msg.text}</Text>
            </View>
          ) : null}

          {/* Section 1: Property Information */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Property Information</Text>

            <Text style={s.label}>Property Name *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Sunrise Bay Resort & Villas"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={s.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              {CATEGORIES.map(cat => {
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={s.label}>Description *</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Describe your property, views, atmosphere, guest experience..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Section 2: Location Details */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Location Details</Text>

            <Text style={s.label}>County *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              {COUNTIES.map(c => {
                const active = county === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setCounty(c)}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={s.label}>Town / Area *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Diani Beach, Nyali, Naivasha"
              placeholderTextColor={colors.textMuted}
              value={town}
              onChangeText={setTown}
            />

            <Text style={s.label}>Physical Address / Landmark *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Beach Road, Off Diani Beach Rd"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Section 3: Pricing & Capacity */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Pricing & Capacity</Text>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Base Price per Night (KSh) *</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 7500"
                  placeholderTextColor={colors.textMuted}
                  value={basePrice}
                  onChangeText={setBasePrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Max Guests</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 4"
                  placeholderTextColor={colors.textMuted}
                  value={maxGuests}
                  onChangeText={setMaxGuests}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ marginTop: Spacing.two }}>
              <Text style={s.label}>Total Units / Rooms</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. 6"
                placeholderTextColor={colors.textMuted}
                value={totalRooms}
                onChangeText={setTotalRooms}
                keyboardType="numeric"
              />
            </View>

            <View style={{ marginTop: Spacing.two }}>
              <Text style={s.label}>Booking URL / Direct WhatsApp Contact (optional)</Text>
              <TextInput
                style={s.input}
                placeholder="https://... or WhatsApp phone"
                placeholderTextColor={colors.textMuted}
                value={bookingUrl}
                onChangeText={setBookingUrl}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Section 4: Amenities */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Amenities ({selectedAmenities.length} selected)</Text>
            <View style={s.amenitiesGrid}>
              {AMENITIES.map(a => {
                const active = selectedAmenities.includes(a);
                return (
                  <TouchableOpacity
                    key={a}
                    style={[s.amenityChip, active && s.amenityActive]}
                    onPress={() => toggleAmenity(a)}
                  >
                    <Text style={[s.amenityText, active && s.amenityTextActive]}>
                      {active ? '✓ ' : '+ '}{a}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 5: Photos */}
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.cardTitle}>Property Photos</Text>
              <TouchableOpacity style={s.photoBtn} onPress={pickImages}>
                <CameraIcon color="#fff" size={14} />
                <Text style={s.photoBtnText}> Add Photos</Text>
              </TouchableOpacity>
            </View>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[s.subLabel, { color: colors.textMuted }]}>Existing Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {existingImages.map((img, idx) => {
                    const uri = typeof img === 'string' ? img : (img.imageUrl || img.url);
                    return (
                      <View key={idx} style={s.photoThumbWrap}>
                        <Image source={{ uri }} style={s.photoThumb} />
                        <TouchableOpacity style={s.removePhotoBtn} onPress={() => removeExistingImage(idx)}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* New images */}
            {newImages.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text style={[s.subLabel, { color: colors.textMuted }]}>New Photos to Upload ({newImages.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {newImages.map((uri, idx) => (
                    <View key={idx} style={s.photoThumbWrap}>
                      <Image source={{ uri }} style={s.photoThumb} />
                      <TouchableOpacity style={s.removePhotoBtn} onPress={() => removeNewImage(idx)}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : existingImages.length === 0 ? (
              <TouchableOpacity style={s.photoEmpty} onPress={pickImages}>
                <CameraIcon color={ACCENT} size={32} />
                <Text style={[s.photoEmptyText, { color: colors.text }]}>No photos selected</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Tap to choose high quality photos</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.submitText}>
                {isEditing ? 'Save Changes' : 'Submit Property for Review'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.backgroundElement,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backBtnText: { color: ACCENT, fontSize: FontSize.sm, fontWeight: '700' },
  headerTitle: { fontSize: FontSize.md, fontWeight: '800', color: colors.text },
  scroll: { padding: Spacing.three, paddingBottom: 40 },
  msgBox: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md,
    padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1,
  },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: colors.text, flex: 1 },
  card: {
    backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border,
    borderRadius: BorderRadius.xl, padding: Spacing.three, marginBottom: Spacing.three,
  },
  cardTitle: { fontSize: FontSize.base, fontWeight: '800', color: colors.text, marginBottom: Spacing.two },
  label: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: Spacing.two,
  },
  subLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.md, color: colors.text,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 12 },
  chipScroll: { marginBottom: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '800' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  amenityChip: {
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  amenityActive: { backgroundColor: ACCENT + '20', borderColor: ACCENT },
  amenityText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  amenityTextActive: { color: ACCENT, fontWeight: '800' },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md,
  },
  photoBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  photoThumbWrap: { position: 'relative', marginRight: 10 },
  photoThumb: { width: 90, height: 70, borderRadius: 8 },
  removePhotoBtn: {
    position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.7)',
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  photoEmpty: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: BorderRadius.lg, padding: 24, alignItems: 'center', marginTop: 10,
  },
  photoEmptyText: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  submitBtn: {
    backgroundColor: ACCENT, borderRadius: BorderRadius.lg, padding: 16,
    alignItems: 'center', marginTop: Spacing.two, marginBottom: Spacing.four,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35,
    shadowRadius: 12, elevation: 6,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: '900', letterSpacing: 0.3 },
});
