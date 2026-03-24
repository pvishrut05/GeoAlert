import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, AlarmFormData, AppSettings } from '../types';
import { seedAlarms, defaultSettings } from '../constants';

interface AlarmStore {
  // State
  alarms: Alarm[];
  settings: AppSettings;
  hasSeeded: boolean;

  // Alarm actions
  addAlarm: (data: AlarmFormData) => void;
  updateAlarm: (id: string, data: Partial<AlarmFormData>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;

  // Settings actions
  updateSettings: (data: Partial<AppSettings>) => void;

  // Seed
  seedIfNeeded: () => void;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set, get) => ({
      alarms: [],
      settings: defaultSettings,
      hasSeeded: false,

      addAlarm: (data) => {
        const now = new Date().toISOString();
        const alarm: Alarm = {
          ...data,
          id: Date.now().toString(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ alarms: [...state.alarms, alarm] }));
      },

      updateAlarm: (id, data) => {
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id
              ? { ...a, ...data, updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      deleteAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
        }));
      },

      toggleAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id
              ? { ...a, isEnabled: !a.isEnabled, updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      updateSettings: (data) => {
        set((state) => ({
          settings: { ...state.settings, ...data },
        }));
      },

      seedIfNeeded: () => {
        if (!get().hasSeeded) {
          set({ alarms: seedAlarms, hasSeeded: true });
        }
      },
    }),
    {
      name: 'geo-alarm-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
