import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SelectedPlace } from '../types';
import { theme } from '../constants';

interface Props {
  place: SelectedPlace;
  onPress: (place: SelectedPlace) => void;
  isLast?: boolean;
}

export function PlaceRow({ place, onPress, isLast }: Props) {
  const icon = place.agency === 'CTA' ? '🚇' : place.agency === 'Metra' ? '🚆' : '📍';

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.withBorder]}
      activeOpacity={0.6}
      onPress={() => onPress(place)}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {place.label}
        </Text>
        {!!place.address && (
          <Text style={styles.detail} numberOfLines={1}>
            {place.address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.xl,
  },
  withBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    marginBottom: 2,
  },
  detail: {
    fontSize: theme.font.size.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 0.1,
  },
});
