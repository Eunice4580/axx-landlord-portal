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
} from 'react-native';
import { propertyAPI, caretakerAPI } from '../services/api';
import { Spacing } from '../constants/theme';
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
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load properties:', err.message))
      .finally(() => setLoadingProps(false));
  }, []);

  const toggleProperty = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleInvite = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Missing info', 'Please fill in name, email, and phone.');
      return;
    }

    setLoading(true);
    try {
      const response = await caretakerAPI.inviteCaretaker(
        name,
        email,
        phone,
        selectedIds
      );
      Alert.alert(
        'Caretaker Invited',
        `${name} has been added.\n\nTemporary password: ${response.tempPassword}\n\nShare this with them securely so they can log in.`,
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error) {
      Alert.alert('Invite failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Invite Caretaker</Text>

      <TextInput
        style={styles.input}
        placeholder="Caretaker's full name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.sectionTitle}>Assign Properties (optional)</Text>

      {loadingProps ? (
        <ActivityIndicator color={colors.primary} />
      ) : properties.length === 0 ? (
        <Text style={styles.emptyText}>No properties to assign yet.</Text>
      ) : (
        properties.map((p) => (
          <TouchableOpacity
            key={p._id}
            style={[
              styles.propertyOption,
              selectedIds.includes(p._id) && styles.propertyOptionSelected,
            ]}
            onPress={() => toggleProperty(p._id)}
          >
            <Text
              style={[
                styles.propertyOptionText,
                selectedIds.includes(p._id) && styles.propertyOptionTextSelected,
              ]}
            >
              {p.title}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleInvite}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Invite</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: Spacing.four,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  propertyOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  propertyOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  propertyOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  propertyOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    marginBottom: Spacing.three,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
