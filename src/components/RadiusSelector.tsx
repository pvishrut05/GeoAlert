import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../constants';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function RadiusSelector({
  value,
  onChange,
  min = 50,
  max = 1000,
  step = 25,
}: Props) {
  const formatRadius = (r: number) => (r >= 1000 ? `${(r / 1000).toFixed(1)}km` : `${r}m`);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Radius</Text>
        <Text style={styles.value}>{formatRadius(value)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={theme.colors.accent}
        maximumTrackTintColor="rgba(255,255,255,0.08)"
        thumbTintColor="#fff"
      />
      <View style={styles.range}>
        <Text style={styles.rangeText}>{formatRadius(min)}</Text>
        <Text style={styles.rangeText}>{formatRadius(max)}</Text>
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
