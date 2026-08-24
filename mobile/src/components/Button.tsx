import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

interface ButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'text';
}

export function Button({ label, loading = false, variant = 'primary', disabled, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  text: { backgroundColor: 'transparent' },
  label: { fontSize: 16, fontWeight: '700' },
  primaryLabel: { color: colors.white },
  outlineLabel: { color: colors.primary },
  dangerLabel: { color: colors.white },
  textLabel: { color: colors.primary },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
