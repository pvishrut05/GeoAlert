import { Alarm, AppSettings } from '../types';

// ─── Theme ───────────────────────────────────────────────────────────────────

export const theme = {
  colors: {
    bg: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    text: '#F5F5F7',
    textSecondary: 'rgba(255,255,255,0.38)',
    textTertiary: 'rgba(255,255,255,0.2)',
    accent: '#34C759',
    accentDim: 'rgba(52,199,89,0.35)',
    destructive: '#FF3B30',
    destructiveDim: 'rgba(255,59,48,0.12)',
    separator: 'rgba(255,255,255,0.06)',
    switchOff: 'rgba(120,120,128,0.32)',
    warning: '#FF9F0A',
    overlay: 'rgba(0,0,0,0.7)',
    inputBg: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.08)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },
  font: {
    size: {
      xs: 10,
      sm: 12,
      caption: 13,
      body: 15,
      callout: 16,
      headline: 17,
      title2: 22,
      title1: 28,
      largeTitle: 34,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
} as const;

// ─── Seed Alarms ─────────────────────────────────────────────────────────────

export const seedAlarms: Alarm[] = [
  {
    id: '1',
    label: 'Union Station',
    locationName: 'Union Station',
    address: 'Union Station, Chicago, IL',
    latitude: 41.8786,
    longitude: -87.6402,
    radius: 50,
    triggerType: 'arriving',
    sound: 'radar',
    vibrationEnabled: true,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    label: 'Home',
    locationName: 'Home',
    address: 'Brooklyn Heights, Brooklyn',
    latitude: 40.6961,
    longitude: -73.9936,
    radius: 150,
    triggerType: 'arriving',
    sound: 'radar',
    vibrationEnabled: true,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    label: 'Office',
    locationName: 'Office',
    address: 'Hudson Yards, Manhattan',
    latitude: 40.7536,
    longitude: -74.0003,
    radius: 300,
    triggerType: 'leaving',
    sound: 'radar',
    vibrationEnabled: false,
    isEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    label: 'Airport Pickup',
    locationName: 'JFK Airport',
    address: 'JFK Airport, Terminal 4',
    latitude: 40.6413,
    longitude: -73.7781,
    radius: 500,
    triggerType: 'arriving',
    sound: 'radar',
    vibrationEnabled: true,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Default Settings ────────────────────────────────────────────────────────

export const defaultSettings: AppSettings = {
  defaultRadius: 200,
  defaultSound: 'radar',
  vibrationEnabled: true,
  locationPermission: 'undetermined',
  notificationPermission: 'undetermined',
};

// ─── Sound Options ───────────────────────────────────────────────────────────

export const soundOptions = [
  'radar',
  'beacon',
  'chime',
  'signal',
  'pulse',
  'none',
] as const;

// ─── Radius Presets ──────────────────────────────────────────────────────────

export const radiusPresets = [50, 100, 200, 300, 500, 1000] as const;
