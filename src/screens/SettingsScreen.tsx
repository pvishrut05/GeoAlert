import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer, SectionHeader, SettingRow } from '../components';
import { useAlarmStore } from '../store';
import { usePermissions } from '../hooks';
import { theme } from '../constants';

export function SettingsScreen() {
  const settings = useAlarmStore((s) => s.settings);
  const updateSettings = useAlarmStore((s) => s.updateSettings);
  const { locationStatus, notificationStatus, requestAll } = usePermissions();

  const formatRadius = (r: number) =>
    r >= 1000 ? `${(r / 1000).toFixed(1)}km` : `${r}m`;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionHeader title="Permissions" />
        <SettingRow
          label="Location Access"
          value={locationStatus === 'granted' ? 'Allowed' : 'Not Allowed'}
          statusDot={locationStatus === 'granted' ? 'green' : 'yellow'}
          onPress={locationStatus !== 'granted' ? requestAll : undefined}
        />
        <SettingRow
          label="Notifications"
          value={notificationStatus === 'granted' ? 'Allowed' : 'Not Allowed'}
          statusDot={notificationStatus === 'granted' ? 'green' : 'yellow'}
          onPress={notificationStatus !== 'granted' ? requestAll : undefined}
          isLast
        />

        <SectionHeader title="Defaults" />
        <SettingRow
          label="Default Radius"
          value={formatRadius(settings.defaultRadius)}
        />
        <SettingRow
          label="Default Sound"
          value={settings.defaultSound.charAt(0).toUpperCase() + settings.defaultSound.slice(1)}
        />
        <SettingRow
          label="Vibration"
          showSwitch
          switchValue={settings.vibrationEnabled}
          onSwitchChange={(val) => updateSettings({ vibrationEnabled: val })}
          isLast
        />

        <View style={styles.footer}>
          <Text style={styles.version}>Geo Alarm v1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.font.size.largeTitle,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  version: {
    fontSize: theme.font.size.sm,
    color: theme.colors.textTertiary,
  },
});
