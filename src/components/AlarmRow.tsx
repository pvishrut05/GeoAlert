import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Alarm } from '../types';
import { theme } from '../constants';
import { formatRadiusMiles } from '../utils/geo';

interface Props {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onPress: (alarm: Alarm) => void;
  isLast?: boolean;
}

export function AlarmRow({ alarm, onToggle, onPress, isLast }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => onPress(alarm)}
      style={[styles.row, !isLast && styles.withBorder]}
    >
      <View style={[styles.content, !alarm.isEnabled && styles.disabled]}>
        <Text style={styles.label} numberOfLines={1}>
          {alarm.label}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          <Text style={styles.triggerType}>
            {alarm.triggerType === 'arriving' ? 'Arriving' : 'Leaving'}
          </Text>
          {'  ·  '}
          {formatRadiusMiles(alarm.radius)}
          {alarm.address ? `  ·  ${alarm.address}` : ''}
        </Text>
      </View>
      <Switch
        value={alarm.isEnabled}
        onValueChange={() => onToggle(alarm.id)}
        trackColor={{
          false: theme.colors.switchOff,
          true: theme.colors.accent,
        }}
        thumbColor="#fff"
        ios_backgroundColor={theme.colors.switchOff}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  withBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.lg,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: theme.font.size.title2 - 2,
    fontWeight: theme.font.weight.regular,
    color: theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  meta: {
    fontSize: theme.font.size.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 0.1,
  },
  triggerType: {
    textTransform: 'capitalize',
  },
});
