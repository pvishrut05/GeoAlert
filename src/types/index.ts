export interface Alarm {
  id: string;
  label: string;
  locationName: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  triggerType: 'arriving' | 'leaving';
  sound: string;
  vibrationEnabled: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AlarmFormData = Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>;

export interface LocationResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface AppSettings {
  defaultRadius: number;
  defaultSound: string;
  vibrationEnabled: boolean;
  locationPermission: PermissionStatus;
  notificationPermission: PermissionStatus;
}

export type { TransitPlace, SelectedPlace, PlaceSource } from './transit';

