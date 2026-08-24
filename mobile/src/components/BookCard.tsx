import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { mediaUrl } from '../api/client';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import type { Book } from '../types/api';
import { StatusPill } from './StatusPill';

export function BookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const cover = mediaUrl(book.cover_url);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.placeholder]}>
          <Ionicons name="book-outline" size={30} color={colors.primary} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <View style={styles.footer}>
          <StatusPill status={book.availability_status} />
          <Text style={styles.copies}>{book.available_copies}/{book.total_copies} copies</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ECECEC',
    ...shadow.card,
  },
  pressed: { opacity: 0.8 },
  cover: { width: 58, height: 80, borderRadius: radius.sm },
  placeholder: { backgroundColor: '#FCE8EC', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  author: { color: colors.textMuted, fontSize: 13 },
  footer: { marginTop: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copies: { color: colors.textMuted, fontSize: 11 },
});
