import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ route }: Props) {
  const { clearSession } = useAuth();
  const forced = route.params?.forced === true;
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword || !password || !confirmation) return Alert.alert('Missing details', 'Complete all password fields.');
    if (password !== confirmation) return Alert.alert('Passwords do not match', 'Confirm the same new password.');
    setLoading(true);
    try {
      const response = await authApi.changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: confirmation,
      });
      await clearSession();
      Alert.alert('Password changed', response.message);
    } catch (error) {
      Alert.alert('Password not changed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={forced ? ['top', 'bottom'] : []}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{forced ? 'Update your temporary password' : 'Change password'}</Text>
          <Text style={styles.subtitle}>{forced ? 'Your librarian created this account. Set a private password before you continue.' : 'Changing your password signs out every device for your security.'}</Text>
          <View style={styles.form}>
            <Input label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" />
            <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
            <Input label="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" onSubmitEditing={() => void submit()} />
            <Button label="Update password" loading={loading} onPress={() => void submit()} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  card: { padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.white, ...shadow.card },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  form: { marginTop: spacing.xl, gap: spacing.lg },
});
