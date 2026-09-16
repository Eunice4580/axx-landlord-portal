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
  SafeAreaView,
} from 'react-native';
import { propertyAPI, caretakerAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function InviteCaretakerScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProps, setLoadingProps] = useState(true);

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

  const handleInvite = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Missing info', 'Please fill in name, email, and phone.');
      return;
    }
    setLoading(true);
    try {
      const response = await caretakerAPI.inviteCaretaker(name, email, phone, selectedIds);
      Alert.alert(
        'Caretaker Invited',
        `${name} has been added.\n\nTemporary password: ${response.tempPassword}\n\nShare this with them securely.`,
        [{ text: 'Done', onPress: onBack }]
      );
    } catch (error) {
      Alert.alert('Invite failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back nav */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Invite Caretaker</Text>
        <Text style={styles.pageSubtitle}>Add a caretaker to help manage your properties.</Text>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caretaker Details</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Kamau"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="caretaker@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.field, { marginBottom: 0 }]}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="07XXXXXXXX"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Property assignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign Properties (optional)</Text>
          <Text style={styles.sectionHint}>Select which properties this caretaker will manage.</Text>

          {loadingProps ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.two }} />
          ) : properties.length === 0 ? (
            <Text style={styles.emptyText}>No properties to assign yet.</Text>
          ) : (
            properties.map(p => {
              const selected = selectedIds.includes(p._id);
              return (
                <TouchableOpacity
                  key={p._id}
                  style={[styles.propertyRow, selected && styles.propertyRowSelected]}
                  onPress={() => toggleProperty(p._id)}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
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

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleInvite}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Send Invite</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  backBtn: { marginBottom: Spacing.three },
  backBtnText: { color: colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  pageTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.four,
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
    marginBottom: Spacing.three,
  },
  field: { marginBottom: Spacing.two },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: Spacing.one,
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
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.two,
    marginBottom: Spacing.two,
    backgroundColor: colors.background,
  },
  propertyRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '11',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  propertyName: { fontSize: FontSize.md, color: colors.text, fontWeight: '500' },
  propertyNameSelected: { color: colors.primary, fontWeight: '600' },
  propertyLocation: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 },
  emptyText: { color: colors.textSecondary, fontSize: FontSize.sm },
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
