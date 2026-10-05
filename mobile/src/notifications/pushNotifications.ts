import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { pushDeviceApi } from '../api/services';

const PUSH_DEVICE_ID_KEY = 'library_push_device_id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushRegistrationResult =
  | { status: 'ready' }
  | { status: 'permission-denied'; message: string }
  | { status: 'unavailable'; message: string };

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;

  return process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    ?? Constants.easConfig?.projectId
    ?? extra?.eas?.projectId;
}

/**
 * Registers the current physical device only after Android notification
 * permission is granted. This is intentionally separate from login so that a
 * member can decline push alerts and still use the library application.
 */
export async function registerCurrentDevice(requestPermission: boolean): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return { status: 'unavailable', message: 'Push notifications require a physical Android device.' };
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted' && requestPermission) {
    permissions = await Notifications.requestPermissionsAsync();
  }

  if (permissions.status !== 'granted') {
    return { status: 'permission-denied', message: 'Notification permission was not granted.' };
  }

  const currentProjectId = projectId();
  if (!currentProjectId) {
    return {
      status: 'unavailable',
      message: 'Push notifications are not configured in this app build yet. Contact the librarian or developer.',
    };
  }

  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId: currentProjectId })).data;
  const response = await pushDeviceApi.register({
    expo_push_token: expoPushToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
  await SecureStore.setItemAsync(PUSH_DEVICE_ID_KEY, String(response.data.id));

  return { status: 'ready' };
}

/** Removes this phone from the account when the member signs out. */
export async function unregisterCurrentDevice(): Promise<void> {
  const deviceId = await SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY);
  try {
    if (deviceId) await pushDeviceApi.unregister(Number(deviceId));
  } finally {
    await SecureStore.deleteItemAsync(PUSH_DEVICE_ID_KEY);
  }
}
