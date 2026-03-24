import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  AlarmsListScreen,
  AlarmFormScreen,
  LocationPickerScreen,
  AlarmTriggerScreen,
  SettingsScreen,
} from '../screens';
import { theme } from '../constants';
import { RootStackParamList, TabParamList } from './types';

// ─── Dark theme ──────────────────────────────────────────────────────────────

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.accent,
    background: theme.colors.bg,
    card: theme.colors.bg,
    text: theme.colors.text,
    border: theme.colors.separator,
    notification: theme.colors.accent,
  },
};

// ─── Tab Navigator ───────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bg,
          borderTopColor: theme.colors.separator,
          borderTopWidth: 0.5,
          paddingTop: 4,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: '#636366',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="AlarmsList"
        component={AlarmsListScreen}
        options={{
          tabBarLabel: 'Alarms',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack ──────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="AddAlarm"
          component={AlarmFormScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="EditAlarm"
          component={AlarmFormScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="AlarmTrigger"
          component={AlarmTriggerScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
