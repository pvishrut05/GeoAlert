import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../constants';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  autoFocus = false,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.md,
    height: 40,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    padding: 0,
  },
});
