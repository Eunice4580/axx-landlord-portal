import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conversationsAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const POLL_MS = 10000;

const fmtTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
};

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function ChatThreadScreen({
  navigation,
  route,
  conversationId,
  peerName: peerNameProp,
  contextTitle: contextTitleProp,
  myId: myIdProp,
  tokenKey = 'token',
  onBack,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const params = route?.params || {};
  const id = params.id || conversationId;
  const peerName = params.peerName || peerNameProp;
  const contextTitle = params.contextTitle || contextTitleProp;
  const myId = params.myId || myIdProp;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const timerRef = useRef(null);
  const lastCountRef = useRef(-1);

  const load = useCallback(async () => {
    try {
      const res = await conversationsAPI.messages(id, undefined, tokenKey);
      const next = Array.isArray(res?.messages) ? res.messages : [];
      setMessages(next);
      setError('');
      if (next.length !== lastCountRef.current) {
        lastCountRef.current = next.length;
        conversationsAPI.markRead(id, tokenKey).catch(() => {});
      }
    } catch (e) {
      setError(e.message || 'Could not load this conversation.');
    } finally {
      setLoading(false);
    }
  }, [id, tokenKey]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [load]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await conversationsAPI.send(id, body, tokenKey);
      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      setText('');
      setError('');
    } catch (e) {
      setError(e.message || 'Message was not sent. Try again.');
    } finally {
      setSending(false);
    }
  };

  const isMine = (message) =>
    String(message.sender?._id || message.sender || '') === String(myId || '');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (onBack ? onBack() : navigation.goBack())}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{initialsOf(peerName)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {peerName || 'Conversation'}
          </Text>
          {!!contextTitle && (
            <Text style={styles.headerContext} numberOfLines={1}>
              {contextTitle}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            ListHeaderComponent={
              error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No messages yet. Say hello to start the conversation.
              </Text>
            }
            renderItem={({ item }) => {
              const mine = isMine(item);
              return (
                <View
                  style={[
                    styles.bubbleRow,
                    { justifyContent: mine ? 'flex-end' : 'flex-start' },
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        mine ? styles.myBubbleText : null,
                      ]}
                    >
                      {item.text}
                    </Text>
                    <Text
                      style={[
                        styles.bubbleTime,
                        mine ? styles.myBubbleTime : null,
                      ]}
                    >
                      {fmtTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>
              {sending ? '...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { paddingVertical: 4, paddingRight: 4 },
    backText: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: colors.primary,
    },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '18',
      borderWidth: 1,
      borderColor: colors.primary + '44',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerAvatarText: {
      fontSize: FontSize.sm,
      fontWeight: '800',
      color: colors.primary,
    },
    headerName: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: colors.text,
    },
    headerContext: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
      marginTop: 1,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: {
      padding: Spacing.three,
      paddingBottom: Spacing.four,
      gap: 10,
      flexGrow: 1,
    },
    errorBox: {
      borderWidth: 1,
      borderColor: colors.danger + '55',
      backgroundColor: colors.danger + '12',
      borderRadius: BorderRadius.md,
      padding: Spacing.two,
      marginBottom: 6,
    },
    errorText: { fontSize: FontSize.sm, color: colors.danger },
    emptyText: {
      fontSize: FontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 40,
    },
    bubbleRow: { flexDirection: 'row' },
    bubble: {
      maxWidth: '82%',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
      gap: 4,
    },
    myBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    theirBubble: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      fontSize: FontSize.base,
      lineHeight: 20,
      color: colors.text,
    },
    myBubbleText: { color: '#fff' },
    bubbleTime: { fontSize: 10, color: colors.textMuted, alignSelf: 'flex-end' },
    myBubbleTime: { color: '#fecdd3' },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.backgroundElement,
    },
    input: {
      flex: 1,
      maxHeight: 110,
      minHeight: 42,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: FontSize.base,
    },
    sendBtn: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: 18,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  });
