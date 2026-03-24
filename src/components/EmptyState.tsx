import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  icon?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>📍</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxxl,
    paddingBottom: 80,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconText: {
    fontSize: 28,
  },
  message: {
    fontSize: theme.font.size.headline,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  button: {
    paddingHorizontal: 32,
  },
});
