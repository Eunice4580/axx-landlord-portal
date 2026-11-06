import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getFAQsByCategory } from '../../data/faqData';

const NAVY = '#081A34';
const RED = '#d9383a';
const WHITE = '#ffffff';

export default function FAQCategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const faqs = getFAQsByCategory(category.id);
  const [expandedId, setExpandedId] = useState(null);

  const toggleFAQ = (faqId) => {
    setExpandedId(expandedId === faqId ? null : faqId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{category.description}</Text>

        {faqs.map((faq) => (
          <View key={faq.id} style={styles.faqCard}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleFAQ(faq.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.chevron}>
                {expandedId === faq.id ? '▼' : '▶'}
              </Text>
              <Text style={styles.question}>{faq.question}</Text>
            </TouchableOpacity>

            {expandedId === faq.id && (
              <View style={styles.answerContainer}>
                <Text style={styles.answer}>{faq.answer}</Text>
                <View style={styles.helpfulContainer}>
                  <Text style={styles.helpfulText}>Was this helpful?</Text>
                  <View style={styles.helpfulButtons}>
                    <TouchableOpacity style={styles.helpfulBtn} activeOpacity={0.7}>
                      <Text style={styles.helpfulBtnText}>👍 Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.helpfulBtn} activeOpacity={0.7}>
                      <Text style={styles.helpfulBtnText}>👎 No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  faqCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  chevron: {
    marginRight: 12,
    fontSize: 16,
    color: RED,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
    lineHeight: 20,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  answer: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  helpfulContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  helpfulText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  helpfulButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: WHITE,
  },
  helpfulBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },
  bottomPadding: {
    height: 32,
  },
});
