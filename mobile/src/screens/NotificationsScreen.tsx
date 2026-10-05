import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';

import { notificationApi } from '../api/services';
import { registerCurrentDevice } from '../notifications/pushNotifications';
import { StateView } from '../components/StateView';
import type { LibraryNotification } from '../types/api';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import { formatDate } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list });
  const preferences = useQuery({ queryKey: ['notification-preferences'], queryFn: notificationApi.preferences });
  const read = useMutation({
    mutationFn: notificationApi.read,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAll = useMutation({
    mutationFn: notificationApi.readAll,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (error) => Alert.alert('Could not mark notifications read', error instanceof Error ? error.message : 'Please try again.'),
  });
  const updatePreferences = useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
    onError: (error) => Alert.alert('Could not update notification settings', error instanceof Error ? error.message : 'Please try again.'),
  });

  const setPushEnabled = async (enabled: boolean) => {
    if (enabled) {
      try {
        const registration = await registerCurrentDevice(true);
        if (registration.status !== 'ready') {
          Alert.alert('Push notifications unavailable', registration.message);
          return;
        }
      } catch (error) {
        Alert.alert('Could not enable push notifications', error instanceof Error ? error.message : 'Please try again.');
        return;
      }
    }
    updatePreferences.mutate({ push_enabled: enabled });
  };

  const open = (item: LibraryNotification) => {
    const openDestination = () => {
      const hasLoan = typeof item.data.loan_id === 'number';
      navigation.navigate('MainTabs', { screen: 'Library', params: { initialTab: hasLoan ? 'borrowed' : 'requests' } });
    };
    if (item.is_read) {
      openDestination();
      return;
    }
    read.mutate(item.id, { onSuccess: openDestination, onError: (error) => Alert.alert('Could not open notification', error instanceof Error ? error.message : 'Please try again.') });
  };

  if (notifications.isLoading) return <StateView loading message="Loading notifications…" />;
  if (notifications.isError) return <StateView title="Notifications unavailable" message={(notifications.error as Error).message} actionLabel="Retry" onAction={() => void notifications.refetch()} />;

  const items = notifications.data?.data ?? [];
  const unread = notifications.data?.meta?.unread_count ?? 0;
  const settings = preferences.data?.data;
  const isSavingSettings = updatePreferences.isPending || preferences.isLoading;
  return (
    <View style={styles.screen}>
      <View style={styles.settingsCard}>
        <View style={styles.settingsCopy}>
          <Text style={styles.settingsTitle}>Push notifications</Text>
          <Text style={styles.settingsMessage}>Receive book due-date and library activity alerts on this phone.</Text>
        </View>
        <Switch
          value={settings?.push_enabled ?? false}
          onValueChange={(enabled) => void setPushEnabled(enabled)}
          disabled={isSavingSettings}
          trackColor={{ false: colors.border, true: '#E9A5B0' }}
          thumbColor={settings?.push_enabled ? colors.primary : colors.white}
        />
      </View>
      {settings?.push_enabled ? (
        <View style={styles.preferenceRows}>
          <PreferenceRow
            label="Due-date reminders"
            description="Alerts before and after a book due date."
            value={settings.due_soon_enabled && settings.overdue_enabled}
            disabled={isSavingSettings}
            onChange={(enabled) => updatePreferences.mutate({ due_soon_enabled: enabled, overdue_enabled: enabled })}
          />
          <PreferenceRow
            label="Library activity"
            description="Borrow, return, and request updates."
            value={settings.activity_enabled}
            disabled={isSavingSettings}
            onChange={(enabled) => updatePreferences.mutate({ activity_enabled: enabled })}
          />
        </View>
      ) : null}
      {unread > 0 ? <Pressable style={styles.readAll} onPress={() => readAll.mutate()}><Ionicons name="checkmark-done-outline" size={20} color={colors.primary} /><Text style={styles.readAllText}>Mark all as read</Text></Pressable> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow item={item} onPress={() => open(item)} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={notifications.isRefetching} onRefresh={() => void notifications.refetch()} tintColor={colors.primary} />}
        ListEmptyComponent={<StateView icon="notifications-off-outline" title="No notifications" message="Library updates such as approvals and due-date reminders will appear here." />}
      />
    </View>
  );
}

function PreferenceRow({ label, description, value, disabled, onChange }: { label: string; description: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.settingsCopy}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: '#E9A5B0' }}
        thumbColor={value ? colors.primary : colors.white}
      />
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: LibraryNotification; onPress: () => void }) {
  return (
    <Pressable style={[styles.row, !item.is_read && styles.unread]} onPress={onPress}>
      <View style={styles.icon}><Ionicons name={item.type.includes('loan') ? 'book-outline' : 'notifications-outline'} size={22} color={colors.primary} /></View>
      <View style={styles.rowText}>
        <View style={styles.titleLine}><Text style={styles.title}>{item.title}</Text>{!item.is_read ? <View style={styles.dot} /> : null}</View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  settingsCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, margin: spacing.lg, marginBottom: 0, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, ...shadow.card },
  settingsCopy: { flex: 1, gap: 3 },
  settingsTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  settingsMessage: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  preferenceRows: { marginHorizontal: spacing.lg, marginTop: spacing.sm, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.white, ...shadow.card },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  preferenceLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  preferenceDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  readAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  readAllText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  list: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, ...shadow.card },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: spacing.sm },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDECEF' },
  rowText: { flex: 1, gap: 3 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
