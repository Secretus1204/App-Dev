import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme/tokens';
import { Button } from './Button';

interface StateViewProps {
  title?: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function StateView({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
  icon = 'library-outline',
}: StateViewProps) {
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <Ionicons name={icon} size={42} color={colors.textMuted} />
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} variant="outline" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 240,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
