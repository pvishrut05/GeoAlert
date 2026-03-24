import * as Location from 'expo-location';
import { LocationResult, PermissionStatus } from '../types';

// ─── Permission Handling ─────────────────────────────────────────────────────

export async function requestLocationPermission(): Promise<PermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status as PermissionStatus;
}

export async function requestBackgroundLocationPermission(): Promise<PermissionStatus> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status as PermissionStatus;
}

export async function getLocationPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status as PermissionStatus;
}

// ─── Current Location ────────────────────────────────────────────────────────

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}

// ─── Geocoding (stub-ready) ──────────────────────────────────────────────────

export async function searchLocations(query: string): Promise<LocationResult[]> {
  // Stub: returns mock results for MVP
  // Replace with real geocoding API (Google Places, Mapbox, etc.)
  if (!query.trim()) return [];

  const mockResults: LocationResult[] = [
    {
      name: 'Union Station',
      address: '225 S Canal St, Chicago, IL 60606',
      latitude: 41.8786,
      longitude: -87.6402,
    },
    {
      name: 'UIC Campus',
      address: '1200 W Harrison St, Chicago, IL 60607',
      latitude: 41.8697,
      longitude: -87.6475,
    },
    {
      name: 'Millennium Park',
      address: '201 E Randolph St, Chicago, IL 60602',
      latitude: 41.8826,
      longitude: -87.6226,
    },
    {
      name: 'O\'Hare Airport',
      address: '10000 W O\'Hare Ave, Chicago, IL 60666',
      latitude: 41.9742,
      longitude: -87.9073,
    },
    {
      name: 'Wrigley Field',
      address: '1060 W Addison St, Chicago, IL 60613',
      latitude: 41.9484,
      longitude: -87.6553,
    },
  ];

  return mockResults.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.address.toLowerCase().includes(query.toLowerCase())
  );
}

// ─── Geofencing (stub) ───────────────────────────────────────────────────────

export async function startGeofence(
  alarmId: string,
  latitude: number,
  longitude: number,
  radius: number,
  triggerType: 'arriving' | 'leaving'
): Promise<boolean> {
  // Stub: will use expo-location geofencing + expo-task-manager
  // Location.startGeofencingAsync(GEOFENCE_TASK, regions)
  console.log(`[GeoService] Starting geofence for alarm ${alarmId}`, {
    latitude,
    longitude,
    radius,
    triggerType,
  });
  return true;
}

export async function stopGeofence(alarmId: string): Promise<boolean> {
  console.log(`[GeoService] Stopping geofence for alarm ${alarmId}`);
  return true;
}

export async function stopAllGeofences(): Promise<void> {
  console.log('[GeoService] Stopping all geofences');
}
