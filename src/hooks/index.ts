import { useEffect, useState, useCallback } from 'react';
import { useAlarmStore } from '../store';
import {
  getLocationPermissionStatus,
  getNotificationPermissionStatus,
  requestLocationPermission,
  requestNotificationPermission,
} from '../services';
import { PermissionStatus } from '../types';

// ─── Initialize app on first load ───────────────────────────────────────────

export function useAppInit() {
  const seedIfNeeded = useAlarmStore((s) => s.seedIfNeeded);

  useEffect(() => {
    seedIfNeeded();
  }, [seedIfNeeded]);
}

// ─── Permission status checker ───────────────────────────────────────────────

export function usePermissions() {
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>('undetermined');
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('undetermined');

  const checkPermissions = useCallback(async () => {
    const loc = await getLocationPermissionStatus();
    const notif = await getNotificationPermissionStatus();
    setLocationStatus(loc);
    setNotificationStatus(notif);
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestAll = useCallback(async () => {
    const loc = await requestLocationPermission();
    const notif = await requestNotificationPermission();
    setLocationStatus(loc);
    setNotificationStatus(notif);
    return { location: loc, notification: notif };
  }, []);

  return {
    locationStatus,
    notificationStatus,
    checkPermissions,
    requestAll,
  };
}
