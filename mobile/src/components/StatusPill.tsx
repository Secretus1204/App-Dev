import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

const statusColors: Record<string, { background: string; text: string }> = {
  available: { background: '#E8F5EE', text: colors.success },
  approved: { background: '#E8F5EE', text: colors.success },
  returned: { background: '#E8F5EE', text: colors.success },
  pending: { background: '#FFF4E5', text: colors.warning },
  limited: { background: '#FFF4E5', text: colors.warning },
  borrowed: { background: '#EAF2FF', text: colors.info },
  unavailable: { background: '#FDECEC', text: colors.danger },
  overdue: { background: '#FDECEC', text: colors.danger },
  rejected: { background: '#FDECEC', text: colors.danger },
  cancelled: { background: '#EEEEEE', text: colors.textMuted },
};

export function StatusPill({ status }: { status: string }) {
  const palette = statusColors[status] ?? { background: '#EEEEEE', text: colors.textMuted };
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <Text style={[styles.text, { color: palette.text }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  text: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
