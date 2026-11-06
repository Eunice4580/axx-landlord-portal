import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { kenyanUniversities, searchUniversities } from '../constants/kenyanUniversities';

export default function UniversityPicker({ value, onChange, label = 'Nearby University', hint, required, colors }) {
  const [query, setQuery] = useState(value?.name || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value?.id, value?.name]);

  const results = query.trim() ? searchUniversities(query) : kenyanUniversities.slice(0, 12);

  const pick = (uni) => {
    onChange?.(uni);
    setQuery(uni.name);
    setOpen(false);
  };

  const clear = () => {
    onChange?.(null);
    setQuery('');
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}{required ? <Text style={{ color: colors.primary }}> *</Text> : null}
      </Text>

      <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setOpen(true);
            if (!text.trim()) onChange?.(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search university (e.g. JKUAT, Kenyatta, Moi)..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        {!!value?.id && (
          <TouchableOpacity onPress={clear} hitSlop={8}>
            <Text style={[styles.clear, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!value?.id && (
        <View style={[styles.chip, { borderColor: colors.primary, backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.chipName, { color: colors.text }]}>{value.name}</Text>
          <Text style={[styles.chipMeta, { color: colors.textSecondary }]}>
            {[value.location, value.county].filter(Boolean).join(' · ')}
          </Text>
        </View>
      )}

      {open && results.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {results.map((uni) => (
              <TouchableOpacity
                key={uni.id}
                style={[styles.option, value?.id === uni.id && { backgroundColor: colors.primary + '18' }]}
                onPress={() => pick(uni)}
              >
                <Text style={[styles.optionName, { color: colors.text }]}>{uni.name}</Text>
                <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                  {[uni.location, uni.county, uni.code].filter(Boolean).join(' · ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {open && !!query.trim() && results.length === 0 && (
        <Text style={[styles.empty, { color: colors.textMuted }]}>No university found for "{query}"</Text>
      )}

      {!!hint && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 11 },
  clear: { fontSize: 13, fontWeight: '700', padding: 4 },
  chip: {
    borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 8, gap: 2,
  },
  chipName: { fontSize: 13, fontWeight: '700' },
  chipMeta: { fontSize: 11 },
  dropdown: {
    borderWidth: 1, borderRadius: 8, marginTop: 6, overflow: 'hidden',
  },
  option: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(148,163,184,0.25)', gap: 1 },
  optionName: { fontSize: 13, fontWeight: '600' },
  optionSub: { fontSize: 11 },
  empty: { fontSize: 12, marginTop: 6 },
  hint: { fontSize: 11, marginTop: 6, lineHeight: 16 },
});
