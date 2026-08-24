import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { AuthStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your library member account.">
      <Input label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" onSubmitEditing={() => void submit()} />
      <Button label="Sign in" loading={loading} onPress={() => void submit()} />
      <Button label="Forgot password?" variant="text" onPress={() => navigation.navigate('ForgotPassword')} />
      <View style={styles.row}>
        <Text style={styles.muted}>Not a member yet?</Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}> Create account</Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '700' },
});
