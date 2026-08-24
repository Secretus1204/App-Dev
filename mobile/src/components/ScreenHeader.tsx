import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme/tokens';

export function ScreenHeader({
  title,
  subtitle,
  onNotifications,
  badge = 0,
}: {
  title: string;
  subtitle?: string;
  onNotifications?: () => void;
  badge?: number;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.textBlock}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {onNotifications ? (
          <Pressable accessibilityLabel="Notifications" style={styles.iconButton} onPress={onNotifications}>
            <Ionicons name="notifications-outline" size={25} color={colors.white} />
            {badge > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text></View> : null}
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.primary },
  header: { minHeight: 86, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center' },
  textBlock: { flex: 1, gap: 2 },
  subtitle: { color: '#FFE4E9', fontSize: 13 },
  title: { color: colors.white, fontSize: 23, fontWeight: '800' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  badge: { position: 'absolute', right: 3, top: 2, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  badgeText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
});
