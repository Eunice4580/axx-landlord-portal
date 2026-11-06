import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const NAVY = '#081A34';
const RED = '#d9383a';
const WHITE = '#ffffff';

export default function ContactSupportScreen({ navigation }) {
  const handleEmail = () => {
    Linking.openURL('mailto:support@axxspace.com');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/254745689773');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.title}>We're Here to Help</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to reach our support team
        </Text>

        <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.7}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactDesc}>support@axxspace.com</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp} activeOpacity={0.7}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactDesc}>+254 745 689 773</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            ⏰ Support hours: Monday - Friday, 9am - 5pm EAT
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: NAVY,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    marginTop: 40,
    marginBottom: 24,
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  contactCard: {
    width: '100%',
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 4,
  },
  contactDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
  },
  note: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  noteText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
