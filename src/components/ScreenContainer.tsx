import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants';

interface Props {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({ children, edges = ['top'] }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
});
