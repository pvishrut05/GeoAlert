import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScreenContainer, SearchBar, SectionHeader } from '../components';
import { searchLocations } from '../services';
import { LocationResult } from '../types';
import { theme } from '../constants';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LocationPicker'>;
  route: RouteProp<RootStackParamList, 'LocationPicker'>;
};

const recentPlaces: LocationResult[] = [
  {
    name: 'Union Station',
    address: '225 S Canal St, Chicago, IL',
    latitude: 41.8786,
    longitude: -87.6402,
  },
  {
    name: 'UIC Campus',
    address: '1200 W Harrison St, Chicago, IL',
    latitude: 41.8697,
    longitude: -87.6475,
  },
];

export function LocationPickerScreen({ navigation, route }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);

  const onSelect = (route.params as any)?.onSelect;

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await searchLocations(text);
    setResults(res);
    setSearching(false);
  }, []);

  const handleSelect = useCallback(
    (location: LocationResult) => {
      if (onSelect) {
        onSelect(location);
      }
      navigation.goBack();
    },
    [navigation, onSelect]
  );

  const renderLocationRow = ({ item }: { item: LocationResult }) => (
    <TouchableOpacity
      style={styles.locationRow}
      activeOpacity={0.6}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.pinIcon}>
        <Text style={styles.pinText}>📍</Text>
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.locationAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const displayData = query.trim().length >= 2 ? results : recentPlaces;
  const sectionTitle = query.trim().length >= 2 ? 'Results' : 'Recent Places';

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Search */}
      <SearchBar
        value={query}
        onChangeText={handleSearch}
        placeholder="Search for a place..."
        autoFocus
      />

      {/* Results */}
      <SectionHeader title={sectionTitle} />
      <FlatList
        data={displayData}
        keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
        renderItem={renderLocationRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          searching ? (
            <Text style={styles.emptyText}>Searching...</Text>
          ) : query.trim().length >= 2 ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  cancelButton: {
    fontSize: theme.font.size.callout,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    fontSize: theme.font.size.headline,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.text,
  },
  list: {
    paddingBottom: theme.spacing.xxxl,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  pinIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pinText: {
    fontSize: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: theme.font.size.caption,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    fontSize: theme.font.size.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xxxl,
  },
});
