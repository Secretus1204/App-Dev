import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert } from 'react-native';

import { authApi } from '../api/services';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !token.trim() || !password || !confirmation) {
      return Alert.alert('Missing details', 'Enter the email, reset token, and new password.');
    }
    if (password !== confirmation) return Alert.alert('Passwords do not match');
    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        password,
        password_confirmation: confirmation,
      });
      Alert.alert('Password updated', response.message, [{ text: 'Sign in', onPress: () => navigation.popToTop() }]);
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Use the reset token from your email. Tokens expire automatically.">
      <Input label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Reset token" value={token} onChangeText={setToken} autoCapitalize="none" />
      <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <Input label="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry />
      <Button label="Reset password" loading={loading} onPress={() => void submit()} />
      <Button label="Back" variant="text" onPress={() => navigation.goBack()} />
    </AuthShell>
  );
}
