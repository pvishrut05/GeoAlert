import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../constants';

interface Props {
  label: string;
  value?: string;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  statusDot?: 'green' | 'yellow' | 'red';
  isLast?: boolean;
}

export function SettingRow({
  label,
  value,
  showSwitch,
  switchValue,
  onSwitchChange,
  onPress,
  statusDot,
  isLast,
}: Props) {
  const content = (
    <View style={[styles.row, !isLast && styles.withBorder]}>
      <View style={styles.left}>
        {statusDot && (
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  statusDot === 'green'
                    ? theme.colors.accent
                    : statusDot === 'yellow'
                    ? theme.colors.warning
                    : theme.colors.destructive,
              },
            ]}
          />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      {showSwitch && onSwitchChange ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{
            false: theme.colors.switchOff,
            true: theme.colors.accent,
          }}
          thumbColor="#fff"
          ios_backgroundColor={theme.colors.switchOff}
        />
      ) : value ? (
        <Text style={styles.value}>{value}</Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
  },
  withBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 10,
  },
  label: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  value: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
