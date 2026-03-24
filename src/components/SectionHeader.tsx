import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../constants';

interface Props {
  title: string;
}

export function SectionHeader({ title }: Props) {
  return <Text style={styles.header}>{title.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  header: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.medium,
    color: theme.colors.textTertiary,
    letterSpacing: 0.8,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.sm,
  },
});
