import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'accent' | 'destructive';
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'accent',
  disabled = false,
  style,
}: Props) {
  const isDestructive = variant === 'destructive';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isDestructive ? styles.destructive : styles.accent,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isDestructive ? styles.destructiveText : styles.accentText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accent: {
    backgroundColor: theme.colors.accent,
  },
  destructive: {
    backgroundColor: theme.colors.destructiveDim,
  },
  disabled: {
    opacity: 0.35,
  },
  text: {
    fontSize: theme.font.size.callout,
    fontWeight: theme.font.weight.semibold,
  },
  accentText: {
    color: '#fff',
  },
  destructiveText: {
    color: theme.colors.destructive,
  },
});
