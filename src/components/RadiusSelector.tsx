import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../constants';
import {
  milesToMeters,
  metersToMiles,
  formatRadiusMiles,
  RADIUS_MIN_MILES,
  RADIUS_MAX_MILES,
  RADIUS_STEP_MILES,
} from '../utils/geo';

interface Props {
  /** Radius in meters (internal storage unit). */
  value: number;
  /** Called with new radius in meters. */
  onChange: (meters: number) => void;
}

export function RadiusSelector({ value, onChange }: Props) {
  const currentMiles = metersToMiles(value);

  const handleChange = useCallback(
    (miles: number) => {
      // Round to step to avoid floating point drift
      const rounded = Math.round(miles / RADIUS_STEP_MILES) * RADIUS_STEP_MILES;
      onChange(milesToMeters(rounded));
    },
    [onChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Radius</Text>
        <Text style={styles.value}>{formatRadiusMiles(value)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={RADIUS_MIN_MILES}
        maximumValue={RADIUS_MAX_MILES}
        step={RADIUS_STEP_MILES}
        value={currentMiles}
        onValueChange={handleChange}
        minimumTrackTintColor={theme.colors.accent}
        maximumTrackTintColor="rgba(255,255,255,0.08)"
        thumbTintColor="#fff"
      />
      <View style={styles.range}>
        <Text style={styles.rangeText}>{RADIUS_MIN_MILES} mi</Text>
        <Text style={styles.rangeText}>{RADIUS_MAX_MILES} mi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  value: {
    fontSize: theme.font.size.body,
    color: theme.colors.accent,
    fontWeight: theme.font.weight.medium,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  range: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeText: {
    fontSize: theme.font.size.xs,
    color: theme.colors.textTertiary,
  },
});
