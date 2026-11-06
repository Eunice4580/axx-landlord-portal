import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
} from 'react-native';

const NAVY = '#081A34';
const RED = '#d9383a';
const WHITE = '#ffffff';
const LIGHT_BG = '#f4f6f9';
const BORDER = '#e5e7eb';
const GRAY = '#6b7280';

const CONTACT_OPTIONS = [
  {
    id: 'email_support',
    icon: '✉️',
    label: 'Support Email',
    value: 'support@axxspace.com',
    action: () => Linking.openURL('mailto:support@axxspace.com'),
  },
  {
    id: 'email_admin',
    icon: '📩',
    label: 'Admin Email',
    value: 'admin@axxspace.com',
    action: () => Linking.openURL('mailto:admin@axxspace.com'),
  },
  {
    id: 'whatsapp',
    icon: '💬',
    label: 'WhatsApp',
    value: '+254 745 689 773',
    action: () => Linking.openURL('https://wa.me/254745689773'),
  },
  {
    id: 'phone',
    icon: '📞',
    label: 'Call Us',
    value: '+254 745 689 773',
    action: () => Linking.openURL('tel:+254745689773'),
  },
];

// Default tips (Landlord portal)
const LANDLORD_TIPS = [
  {
    id: 'q1',
    question: 'How do I add a new property?',
    answer: 'From the Dashboard tap the + button or "Add Property". Fill in the details, upload photos, then publish.',
  },
  {
    id: 'q2',
    question: 'My QR code is not working — what do I do?',
    answer: 'Make sure it is printed clearly and well lit. Scan with your phone camera (not WhatsApp). If still failing, regenerate the QR from the property detail screen.',
  },
  {
    id: 'q3',
    question: 'How do I invite a caretaker?',
    answer: 'Go to Settings → My Caretakers → Invite Caretaker. Enter their phone number and they will receive an invite.',
  },
  {
    id: 'q4',
    question: 'How do I track tenant inquiries?',
    answer: 'QR code scans and inquiries are tracked per property. Open a property and tap "QR Stats" to see scan counts and inquiry history.',
  },
  {
    id: 'q5',
    question: 'Why am I not receiving notifications?',
    answer: 'Check phone Settings → Apps → Axxspace → Notifications. Make sure Do Not Disturb is off and battery optimization is disabled for the app.',
  },
];

function QuickTipItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      style={styles.tipCard}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.75}
    >
      <View style={styles.tipHeader}>
        <Text style={styles.tipQuestion}>{item.question}</Text>
        <Text style={[styles.tipChevron, open && styles.tipChevronOpen]}>›</Text>
      </View>
      {open && <Text style={styles.tipAnswer}>{item.answer}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpCenterScreen({ navigation, tips }) {
  const activeTips = tips || LANDLORD_TIPS;
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>We're Here to Help</Text>
          <Text style={styles.heroSubtitle}>
            Reach out any time — our support team typically replies within a few hours.
          </Text>
        </View>

        {/* Contact Section */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>

        {CONTACT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={styles.contactCard}
            onPress={opt.action}
            activeOpacity={0.7}
          >
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{opt.label}</Text>
              <Text style={styles.contactValue}>{opt.value}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Support Hours */}
        <View style={styles.hoursCard}>
          <Text style={styles.hoursText}>
            Support hours: <Text style={styles.hoursBold}>Mon – Fri, 9 am – 5 pm EAT</Text>
          </Text>
        </View>

        {/* Quick Tips */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>QUICK TIPS</Text>

        {activeTips.map((tip) => (
          <QuickTipItem key={tip.id} item={tip} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },

  /* Header */
  header: {
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: NAVY },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    marginLeft: 12,
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  /* Hero */
  hero: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: NAVY,
    padding: 18,
    marginBottom: 20,
    marginTop: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: GRAY,
    lineHeight: 20,
  },

  /* Section Label */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  /* Contact Cards */
  contactCard: {
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    marginBottom: 10,
  },
  contactIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactIcon: { fontSize: 20 },
  contactInfo: { flex: 1 },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 2,
  },
  contactValue: { fontSize: 13, color: GRAY },
  chevron: { fontSize: 22, color: '#c0c7d0' },

  /* Hours */
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    gap: 10,
  },
  hoursIcon: { fontSize: 18 },
  hoursText: { fontSize: 13, color: '#cbd5e1', flex: 1 },
  hoursBold: { fontWeight: '700', color: WHITE },

  /* Quick Tips */
  tipCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
    lineHeight: 20,
  },
  tipChevron: {
    fontSize: 22,
    color: '#9ca3af',
    marginLeft: 8,
    transform: [{ rotate: '0deg' }],
  },
  tipChevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  tipAnswer: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
});
