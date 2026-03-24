# Geo Alarm

A location-based alarm app for iOS, built with React Native + Expo + TypeScript.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Xcode** 15+ (for iOS simulator) or **Expo Go** app on your iPhone

## Quick Start

```bash
# 1. Navigate to the project
cd geo-alarm

# 2. Install dependencies
npm install

# 3. Install the slider package (used by RadiusSelector)
npx expo install @react-native-community/slider

# 4. Start the dev server
npx expo start
```

### Run on iPhone

- **Expo Go (easiest):** Scan the QR code with your iPhone camera
- **Simulator:** Press `i` in the terminal to open iOS Simulator

## Project Structure

```
geo-alarm/
├── App.tsx                    # Entry point
├── app.json                   # Expo config
├── package.json
├── tsconfig.json
└── src/
    ├── components/            # Reusable UI components
    │   ├── AlarmRow.tsx       # Alarm list row
    │   ├── EmptyState.tsx     # Empty list placeholder
    │   ├── PrimaryButton.tsx  # Accent/destructive buttons
    │   ├── RadiusSelector.tsx # Slider for geofence radius
    │   ├── ScreenContainer.tsx# Safe area wrapper
    │   ├── SearchBar.tsx      # Search input
    │   ├── SectionHeader.tsx  # Uppercase section labels
    │   ├── SegmentedControl.tsx# Arriving/Leaving toggle
    │   └── SettingRow.tsx     # Settings list row
    ├── screens/
    │   ├── AlarmsListScreen.tsx    # Main alarm list
    │   ├── AlarmFormScreen.tsx     # Add + Edit alarm
    │   ├── LocationPickerScreen.tsx# Search & pick location
    │   ├── AlarmTriggerScreen.tsx  # Full-screen alarm alert
    │   └── SettingsScreen.tsx      # App settings
    ├── navigation/
    │   ├── index.tsx          # Tab + Stack navigators
    │   └── types.ts           # Navigation param types
    ├── store/
    │   └── index.ts           # Zustand store + AsyncStorage persistence
    ├── services/
    │   ├── location.ts        # Location + geofencing abstraction
    │   └── notification.ts    # Notification abstraction
    ├── hooks/
    │   └── index.ts           # useAppInit, usePermissions
    ├── types/
    │   └── index.ts           # Alarm, Settings, LocationResult types
    └── constants/
        └── index.ts           # Theme, seed data, config
```

## Architecture Notes

### Service Layer (Stubbed for MVP)

The `services/` directory contains abstractions for:

- **Location:** Geofence start/stop, geocoding search, permission handling
- **Notifications:** Local notification triggers, permission handling

These are stubbed with console logs and mock data. To add real geofencing:

1. Implement `expo-task-manager` background task
2. Use `Location.startGeofencingAsync()` in `services/location.ts`
3. Trigger notifications from the background task via `services/notification.ts`

### State Management

Zustand with `AsyncStorage` persistence. Alarms persist across app restarts.
Seed data loads on first launch only.

### Design System

All colors, spacing, font sizes, and radii are in `constants/index.ts` under the
`theme` object. The palette uses:

- **Background:** Pure black (#000000)
- **Text:** Near-white (#F5F5F7)
- **Accent:** iOS green (#34C759)
- **Destructive:** iOS red (#FF3B30) — delete actions only

## Adding Real Geofencing

```typescript
// In services/location.ts, replace the startGeofence stub:
import * as TaskManager from 'expo-task-manager';

const GEOFENCE_TASK = 'geo-alarm-geofence';

TaskManager.defineTask(GEOFENCE_TASK, ({ data, error }) => {
  if (error) return;
  const { eventType, region } = data as any;
  // Trigger notification based on eventType + alarmId from region.identifier
});

export async function startGeofence(alarmId, lat, lng, radius, triggerType) {
  await Location.startGeofencingAsync(GEOFENCE_TASK, [
    {
      identifier: alarmId,
      latitude: lat,
      longitude: lng,
      radius,
      notifyOnEnter: triggerType === 'arriving',
      notifyOnExit: triggerType === 'leaving',
    },
  ]);
}
```

## License

Private — not for redistribution.
