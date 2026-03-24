import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../constants';

interface Props {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function SegmentedControl({ options, selectedIndex, onChange }: Props) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.7}
            onPress={() => onChange(index)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  label: {
    fontSize: 14,
    fontWeight: theme.font.weight.medium,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  labelSelected: {
    color: theme.colors.text,
  },
});
