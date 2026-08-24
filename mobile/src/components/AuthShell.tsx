import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '../theme/tokens';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}><Ionicons name="library" size={38} color={colors.white} /></View>
            <Text style={styles.brandName}>Pilipog Library</Text>
            <Text style={styles.brandTagline}>Read. Learn. Grow.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.form}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  brand: { alignItems: 'center', gap: spacing.xs },
  logo: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  brandName: { marginTop: spacing.sm, color: colors.primaryDark, fontSize: 25, fontWeight: '800' },
  brandTagline: { color: colors.textMuted, fontSize: 14 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, ...shadow.card },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
  form: { marginTop: spacing.xl, gap: spacing.lg },
});
