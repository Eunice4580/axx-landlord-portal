import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Polyline, Circle, Line, Rect } from 'react-native-svg';

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';
const ACCENT   = '#fbbf24';

/* ── Colors ─────────────────────────────────────────────────── */
const C = {
  bg:    '#0f172a',
  card:  '#1e293b',
  input: '#0f172a',
  border:'rgba(255,255,255,0.08)',
  text:  '#f1f5f9',
  muted: '#94a3b8',
  green: '#10b981',
  red:   '#ef4444',
};

/* ── Icons ───────────────────────────────────────────────────── */
const ArrowLeft   = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 5l-7 7 7 7" />
  </Svg>
);
const PlusIcon    = ({ color = C.bg }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
    <Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);
const EditIcon    = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
const TrashIcon   = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" /><Path d="M19 6l-1 14H6L5 6" /><Path d="M10 11v6M14 11v6" /><Path d="M9 6V4h6v2" />
  </Svg>
);
const BedIcon     = ({ color = C.muted }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" />
    <Path d="M2 20v-5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v5" />
    <Line x1="2" y1="20" x2="22" y2="20" />
  </Svg>
);
const UsersIcon   = ({ color = C.muted }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);
const CheckIcon   = ({ color = C.green }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
const AlertIcon   = ({ color = C.red }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" /><Line x1="12" y1="8" x2="12" y2="12" /><Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

/* ── Bed type options ────────────────────────────────────────── */
const BED_TYPES = ['Single', 'Double', 'Queen', 'King', 'Twin', 'Triple', 'Bunk', 'Sofa Bed'];

/* ── Banner ──────────────────────────────────────────────────── */
function Banner({ msg }) {
  if (!msg?.text) return null;
  return (
    <View style={[s.banner, msg.ok ? s.bannerOk : s.bannerErr]}>
      {msg.ok ? <CheckIcon /> : <AlertIcon />}
      <Text style={[s.bannerText, { color: msg.ok ? C.green : C.red }]}> {msg.text}</Text>
    </View>
  );
}

/* ── Input ───────────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}{required && <Text style={{ color: C.red }}> *</Text>}</Text>
      {children}
    </View>
  );
}

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[s.input, focused && { borderColor: ACCENT }, style]}
      placeholderTextColor={C.muted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  );
}

/* ── Room Type Form ──────────────────────────────────────────── */
function RoomTypeForm({ accommodationId, token, editData, onSaved, onCancel }) {
  const [name, setName]             = useState(editData?.name || '');
  const [capacity, setCapacity]     = useState(editData?.capacity ? String(editData.capacity) : '');
  const [pricePerNight, setPrice]   = useState(editData?.pricePerNight ? String(editData.pricePerNight) : '');
  const [quantity, setQuantity]     = useState(editData?.quantity ? String(editData.quantity) : '');
  const [bedType, setBedType]       = useState(editData?.bedType || '');
  const [size, setSize]             = useState(editData?.size || '');
  const [description, setDesc]      = useState(editData?.description || '');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState(null);

  const isEdit = !!editData;

  const handleSave = async () => {
    if (!name.trim())         { setMsg({ text: 'Room name is required.', ok: false }); return; }
    if (!capacity.trim())     { setMsg({ text: 'Capacity is required.', ok: false }); return; }
    if (!pricePerNight.trim()){ setMsg({ text: 'Price per night is required.', ok: false }); return; }
    if (!quantity.trim())     { setMsg({ text: 'Quantity is required.', ok: false }); return; }

    setLoading(true);
    setMsg(null);
    try {
      const body = {
        name: name.trim(),
        capacity: parseInt(capacity),
        pricePerNight: parseFloat(pricePerNight),
        quantity: parseInt(quantity),
        ...(bedType && { bedType }),
        ...(size.trim() && { size: size.trim() }),
        ...(description.trim() && { description: description.trim() }),
      };

      const url = isEdit
        ? `${API_BASE}/accommodations/room-types/${editData._id}`
        : `${API_BASE}/accommodations/${accommodationId}/room-types`;

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to save room type');

      setMsg({ text: isEdit ? 'Room type updated.' : 'Room type added.', ok: true });
      setTimeout(() => onSaved(), 900);
    } catch (err) {
      setMsg({ text: err.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.formCard]}>
      <Text style={s.formTitle}>{isEdit ? 'Edit Room Type' : 'Add Room Type'}</Text>
      <Banner msg={msg} />

      <Field label="Room / Unit Name" required>
        <Input value={name} onChangeText={setName} placeholder="e.g. Deluxe Double Room" />
      </Field>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Field label="Capacity (guests)" required>
            <Input value={capacity} onChangeText={setCapacity} placeholder="e.g. 2" keyboardType="numeric" />
          </Field>
        </View>
        <View style={s.rowSpacer} />
        <View style={{ flex: 1 }}>
          <Field label="Qty Available" required>
            <Input value={quantity} onChangeText={setQuantity} placeholder="e.g. 5" keyboardType="numeric" />
          </Field>
        </View>
      </View>

      <Field label="Price Per Night (KSh)" required>
        <Input value={pricePerNight} onChangeText={setPrice} placeholder="e.g. 3500" keyboardType="decimal-pad" />
      </Field>

      <Field label="Bed Type">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.chipRow}>
            {BED_TYPES.map(bt => {
              const active = bedType === bt;
              return (
                <TouchableOpacity
                  key={bt}
                  style={[s.chip, { borderColor: active ? ACCENT : C.border, backgroundColor: active ? ACCENT + '20' : 'transparent' }]}
                  onPress={() => setBedType(active ? '' : bt)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, { color: active ? ACCENT : C.muted }]}>{bt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Field>

      <Field label="Room Size">
        <Input value={size} onChangeText={setSize} placeholder='e.g. "30 sqm"' />
      </Field>

      <Field label="Description">
        <Input
          value={description} onChangeText={setDesc}
          placeholder="Describe the room — views, furnishings, etc."
          multiline numberOfLines={3} style={{ minHeight: 72, textAlignVertical: 'top' }}
        />
      </Field>

      <View style={s.formBtns}>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={C.bg} size="small" />
            : <Text style={s.saveBtnText}>{isEdit ? 'Save Changes' : 'Add Room'}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Room Type Card ──────────────────────────────────────────── */
function RoomCard({ room, onEdit, onDelete }) {
  return (
    <View style={s.roomCard}>
      <View style={s.roomHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.roomName}>{room.name}</Text>
          <View style={s.roomMeta}>
            {room.bedType && (
              <View style={s.metaChip}>
                <BedIcon color={ACCENT} />
                <Text style={[s.metaChipText, { color: ACCENT }]}> {room.bedType}</Text>
              </View>
            )}
            <View style={s.metaChip}>
              <UsersIcon color={C.muted} />
              <Text style={[s.metaChipText, { color: C.muted }]}> {room.capacity} guests</Text>
            </View>
            <View style={s.metaChip}>
              <Text style={[s.metaChipText, { color: C.muted }]}>{room.quantity} available</Text>
            </View>
          </View>
        </View>
        <View style={s.roomPriceWrap}>
          <Text style={s.roomPrice}>KSh {(room.pricePerNight || 0).toLocaleString()}</Text>
          <Text style={s.roomPriceSub}>/night</Text>
        </View>
      </View>

      {room.size && (
        <Text style={s.roomSize}>{room.size}</Text>
      )}
      {room.description && (
        <Text style={s.roomDesc} numberOfLines={2}>{room.description}</Text>
      )}

      <View style={s.roomActions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => onEdit(room)} activeOpacity={0.8}>
          <EditIcon />
          <Text style={[s.actionText, { color: ACCENT }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => onDelete(room)} activeOpacity={0.8}>
          <TrashIcon />
          <Text style={[s.actionText, { color: C.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Property selector ───────────────────────────────────────── */
function PropChip({ prop, active, onPress }) {
  return (
    <TouchableOpacity
      style={[s.propChip, { borderColor: active ? ACCENT : C.border, backgroundColor: active ? ACCENT + '20' : 'transparent' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[s.propChipText, { color: active ? ACCENT : C.muted }]} numberOfLines={1}>{prop.name}</Text>
    </TouchableOpacity>
  );
}

/* ── Main Screen ─────────────────────────────────────────────── */
export default function RoomTypesScreen({ accommodations, onBack }) {
  const [token, setToken]               = useState(null);
  const [selectedProp, setSelectedProp] = useState(null);
  const [roomTypes, setRoomTypes]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [editRoom, setEditRoom]         = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Init token + select first property
  useEffect(() => {
    SecureStore.getItemAsync('accom_token').then(t => setToken(t));
    if (accommodations?.length && !selectedProp) {
      setSelectedProp(accommodations[0]);
    }
  }, [accommodations]);

  const fetchRooms = useCallback(async (prop, isRefresh = false) => {
    if (!prop) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/accommodations/${prop._id}/room-types`);
      const data = await res.json();
      setRoomTypes(Array.isArray(data) ? data : data.roomTypes || []);
    } catch (e) {
      console.error('Fetch rooms error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms(selectedProp);
    setShowForm(false);
    setEditRoom(null);
  }, [selectedProp, fetchRooms]);

  const handleDelete = (room) => {
    Alert.alert('Delete Room Type', `Delete "${room.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/accommodations/room-types/${room._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              showToast('Room type deleted.');
              fetchRooms(selectedProp);
            } else {
              const d = await res.json();
              showToast(d.error || 'Failed to delete.', false);
            }
          } catch { showToast('Network error.', false); }
        },
      },
    ]);
  };

  const handleEdit = (room) => {
    setEditRoom(room);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditRoom(null);
    fetchRooms(selectedProp);
  };

  if (!accommodations || accommodations.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={{ padding: 4 }}><ArrowLeft /></TouchableOpacity>
          <Text style={s.headerTitle}>Room Types</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyText}>No properties registered yet.</Text>
          <Text style={[s.emptyText, { fontSize: 12, marginTop: 6 }]}>Register a property first to add room types.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Toast */}
      {toast && (
        <View style={[s.toast, { backgroundColor: toast.ok ? '#064e3b' : '#450a0a' }]}>
          <Text style={{ color: toast.ok ? C.green : C.red, fontWeight: '700', textAlign: 'center' }}>{toast.text}</Text>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }} activeOpacity={0.7}>
          <ArrowLeft />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Room Types & Prices</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRooms(selectedProp, true)}
              tintColor={ACCENT} colors={[ACCENT]}
            />
          }
        >
          {/* Property selector */}
          {accommodations.length > 1 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>SELECT PROPERTY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.chipRow}>
                  {accommodations.map(p => (
                    <PropChip
                      key={p._id}
                      prop={p}
                      active={selectedProp?._id === p._id}
                      onPress={() => setSelectedProp(p)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Form */}
          {showForm && token && (
            <RoomTypeForm
              accommodationId={selectedProp._id}
              token={token}
              editData={editRoom}
              onSaved={handleSaved}
              onCancel={() => { setShowForm(false); setEditRoom(null); }}
            />
          )}

          {/* Room list */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>ROOM TYPES ({roomTypes.length})</Text>
              {!showForm && (
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => { setEditRoom(null); setShowForm(true); }}
                  activeOpacity={0.85}
                >
                  <PlusIcon />
                  <Text style={s.addBtnText}>Add Room</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator color={ACCENT} size="large" style={{ paddingVertical: 30 }} />
            ) : roomTypes.length === 0 ? (
              <View style={s.emptyCard}>
                <BedIcon color={ACCENT} />
                <Text style={[s.emptyText, { marginTop: 10 }]}>No room types yet</Text>
                <Text style={[s.emptyText, { fontSize: 12, marginTop: 4 }]}>
                  Add room types with pricing so guests know what to book.
                </Text>
                <TouchableOpacity
                  style={[s.addBtn, { marginTop: 14, paddingHorizontal: 20, alignSelf: 'center' }]}
                  onPress={() => { setEditRoom(null); setShowForm(true); }}
                  activeOpacity={0.85}
                >
                  <PlusIcon />
                  <Text style={s.addBtnText}>Add First Room</Text>
                </TouchableOpacity>
              </View>
            ) : (
              roomTypes.map(room => (
                <RoomCard
                  key={room._id}
                  room={room}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  toast: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999,
    padding: 14, borderRadius: 10,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },

  section:    { marginTop: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel:{ color: ACCENT, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  chipRow:    { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip:       { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText:   { fontSize: 12, fontWeight: '600' },

  propChip:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  propChipText: { fontSize: 13, fontWeight: '700', maxWidth: 160 },

  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { color: C.bg, fontSize: 13, fontWeight: '800' },

  // Form
  formCard:  { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  formTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  field:     { marginBottom: 14 },
  fieldLabel:{ color: C.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: C.input, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    color: C.text, fontSize: 14,
  },
  row:        { flexDirection: 'row' },
  rowSpacer:  { width: 10 },

  formBtns:     { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn:    { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cancelBtnText:{ color: C.muted, fontWeight: '700' },
  saveBtn:      { flex: 2, backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:  { color: C.bg, fontWeight: '800', fontSize: 14 },

  banner:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  bannerOk:  { backgroundColor: '#064e3b', borderColor: C.green + '50' },
  bannerErr: { backgroundColor: '#450a0a', borderColor: C.red + '50' },
  bannerText:{ fontSize: 13, fontWeight: '600', flex: 1 },

  // Room card
  roomCard:    { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  roomHeader:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  roomName:    { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  roomMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaChipText:{ fontSize: 12, fontWeight: '600' },
  roomPriceWrap:{ alignItems: 'flex-end' },
  roomPrice:   { color: ACCENT, fontSize: 18, fontWeight: '900' },
  roomPriceSub:{ color: C.muted, fontSize: 11, marginTop: 1 },
  roomSize:    { color: C.muted, fontSize: 12, marginBottom: 4 },
  roomDesc:    { color: C.muted, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  roomActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, marginTop: 6 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText:  { fontSize: 13, fontWeight: '700' },

  // Empty
  emptyCard: { backgroundColor: C.card, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyText: { color: C.muted, fontSize: 14, textAlign: 'center' },
});
