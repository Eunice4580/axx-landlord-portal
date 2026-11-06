import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { searchFAQs, getCategoryById } from '../../data/faqData';

const NAVY = '#081A34';
const RED = '#d9383a';
const WHITE = '#ffffff';

export default function FAQSearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.trim().length > 0) {
      const searchResults = searchFAQs(text);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  const handleSelectFAQ = (faq) => {
    const category = getCategoryById(faq.categoryId);
    navigation.navigate('FAQCategory', { category, highlightId: faq.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {query.trim().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Search for help</Text>
            <Text style={styles.emptyText}>
              Type keywords to find answers to your questions
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try different keywords or browse by topic
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </Text>
            {results.map((faq) => {
              const category = getCategoryById(faq.categoryId);
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.resultCard}
                  onPress={() => handleSelectFAQ(faq)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resultQuestion}>{faq.question}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{category.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
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
    marginRight: 8,
  },
  backText: {
    fontSize: 24,
    color: NAVY,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    color: NAVY,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  resultCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: RED,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
