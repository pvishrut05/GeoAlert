import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {PlaceRow} from '../components/PlaceRow';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScreenContainer, SearchBar, SectionHeader } from '../components';
import {
  searchLocalTransitPlaces,
  searchPlaces,
  getDefaultStations,
} from '../services/locationSearch';
import { SelectedPlace } from '../types';
import { theme } from '../constants';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LocationPicker'>;
  route: RouteProp<RootStackParamList, 'LocationPicker'>;
};

export function LocationPickerScreen({ navigation, route }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedPlace[]>([]);
  const [defaults, setDefaults] = useState<SelectedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSelect = (route.params as any)?.onSelect;

  // Load default stations on mount
  useEffect(() => {
    setDefaults(getDefaultStations());
  }, []);

  // Debounced search
  const handleSearch = useCallback((text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = text.trim();
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }

    // Instant local search (synchronous, fast)
    const localResults = searchLocalTransitPlaces(q);
    setResults(localResults);

    // Debounced async search for external fallback
    if (localResults.length < 3 && q.length >= 2) {
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        const merged = await searchPlaces(q);
        setResults(merged);
        setSearching(false);
      }, 300);
    }
  }, []);

  const handleSelect = useCallback(
    (place: SelectedPlace) => {
      if (onSelect) {
        onSelect(place);
      }
      navigation.goBack();
    },
    [navigation, onSelect]
  );

  const hasQuery = query.trim().length >= 1;
  const displayData = hasQuery ? results : defaults;
  const sectionTitle = hasQuery
    ? results.length > 0
      ? 'Stations'
      : ''
    : 'Popular Stations';

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
        placeholder="Station name, line, or city..."
        autoFocus
      />

      {/* Section header */}
      {sectionTitle ? <SectionHeader title={sectionTitle} /> : null}

      {/* Results */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PlaceRow
            place={item}
            onPress={handleSelect}
            isLast={index === displayData.length - 1}
          />
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          hasQuery ? (
            <View style={styles.emptyContainer}>
              {searching ? (
                <Text style={styles.emptyText}>Searching...</Text>
              ) : (
                <>
                  <Text style={styles.emptyText}>No stations found</Text>
                  <Text style={styles.emptyHint}>
                    Try a station name, line code, or city
                  </Text>
                </>
              )}
            </View>
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
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontSize: theme.font.size.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: theme.font.size.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
  },
});
