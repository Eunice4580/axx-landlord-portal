import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { caretakerAPI, caretakerManagementAPI, propertyAPI } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function MyCaretakersScreen({ onBack }) {
  const [caretakers, setCaretakers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const load = useCallback(async () => {
    try {
      const [caretakerData, propertyData] = await Promise.all([
        caretakerAPI.getMyCaretakers(),
        propertyAPI.getMyProperties(),
      ]);
      setCaretakers(caretakerData.caretakers || []);
      setProperties(Array.isArray(propertyData) ? propertyData : []);
    } catch (error) {
      console.error('Failed to load caretakers:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleProperty = async (caretakerId, currentPropertyIds, propertyId) => {
    const newIds = currentPropertyIds.includes(propertyId)
      ? currentPropertyIds.filter((id) => id !== propertyId)
      : [...currentPropertyIds, propertyId];

    try {
      await caretakerManagementAPI.updateProperties(caretakerId, newIds);
      load();
    } catch (error) {
      Alert.alert('Failed', error.message || 'Could not update assignment.');
    }
  };

  const handleRemove = (caretakerId, name) => {
    Alert.alert(
      'Remove Caretaker',
      `Are you sure you want to remove ${name}? They will lose access immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await caretakerManagementAPI.removeCaretaker(caretakerId);
              load();
            } catch (error) {
              Alert.alert('Failed', error.message || 'Could not remove caretaker.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Caretakers</Text>

      <FlatList
        data={caretakers}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No caretakers yet. Invite one from Settings.
          </Text>
        }
        renderItem={({ item }) => {
          const assignedIds = (item.assignedProperties || []).map((p) => p._id);
          const isEditing = editingId === item._id;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                  <Text style={styles.phone}>{item.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemove(item._id, item.name)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.assignedLabel}>
                Assigned Properties ({assignedIds.length})
              </Text>

              {!isEditing ? (
                <>
                  {item.assignedProperties && item.assignedProperties.length > 0 ? (
                    item.assignedProperties.map((p) => (
                      <Text key={p._id} style={styles.propertyLine}>
                        • {p.title}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.propertyLine}>No properties assigned</Text>
                  )}
                  <TouchableOpacity
                    style={styles.editLink}
                    onPress={() => setEditingId(item._id)}
                  >
                    <Text style={styles.editLinkText}>Edit Assignment</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {properties.map((prop) => (
                    <TouchableOpacity
                      key={prop._id}
                      style={[
                        styles.propertyOption,
                        assignedIds.includes(prop._id) && styles.propertyOptionSelected,
                      ]}
                      onPress={() => toggleProperty(item._id, assignedIds, prop._id)}
                    >
                      <Text
                        style={[
                          styles.propertyOptionText,
                          assignedIds.includes(prop._id) && styles.propertyOptionTextSelected,
                        ]}
                      >
                        {prop.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.doneLink}
                    onPress={() => setEditingId(null)}
                  >
                    <Text style={styles.doneLinkText}>Done</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: Spacing.three },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backLink: { color: colors.primary, fontSize: 15, marginBottom: Spacing.three },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: Spacing.three },
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.two },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  phone: { fontSize: 13, color: colors.textSecondary },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  assignedLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: Spacing.two },
  propertyLine: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  editLink: { marginTop: Spacing.two },
  editLinkText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  propertyOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Spacing.two,
    marginTop: Spacing.one,
  },
  propertyOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  propertyOptionText: { fontSize: 13, color: colors.text },
  propertyOptionTextSelected: { color: '#fff', fontWeight: '600' },
  doneLink: { marginTop: Spacing.two, alignSelf: 'flex-end' },
  doneLinkText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.five },
});
