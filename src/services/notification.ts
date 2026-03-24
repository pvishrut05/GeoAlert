import * as Notifications from 'expo-notifications';
import { PermissionStatus } from '../types';

// ─── Setup ───────────────────────────────────────────────────────────────────

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<PermissionStatus> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionStatus;
}

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

// ─── Trigger Alarm Notification ──────────────────────────────────────────────

export async function triggerAlarmNotification(
  label: string,
  address: string,
  triggerType: 'arriving' | 'leaving'
): Promise<void> {
  const action = triggerType === 'arriving' ? 'arriving at' : 'leaving';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📍 ${label}`,
      body: `You're ${action} ${address}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null, // Immediately
  });
}

// ─── Cancel ──────────────────────────────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
