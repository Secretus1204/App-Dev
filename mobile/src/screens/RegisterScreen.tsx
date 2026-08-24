import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', member_id: '', email: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (Object.values(form).some((value) => !value.trim())) {
      Alert.alert('Missing details', 'Complete all account fields.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      Alert.alert('Passwords do not match', 'Confirm the same password in both fields.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create an account" subtitle="Public registration always creates a standard library member account.">
      <Input label="Full name" value={form.name} onChangeText={set('name')} autoComplete="name" />
      <Input label="Member ID" value={form.member_id} onChangeText={set('member_id')} autoCapitalize="characters" />
      <Input label="Email address" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Input label="Password" value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" />
      <Input label="Confirm password" value={form.password_confirmation} onChangeText={set('password_confirmation')} secureTextEntry autoComplete="new-password" />
      <Button label="Create member account" loading={loading} onPress={() => void submit()} />
      <View style={styles.row}>
        <Text style={styles.muted}>Already registered?</Text>
        <Text style={styles.link} onPress={() => navigation.goBack()}> Sign in</Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '700' },
});
