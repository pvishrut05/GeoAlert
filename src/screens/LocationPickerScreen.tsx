import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScreenContainer, SearchBar, SectionHeader, PlaceRow } from '../components';
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

const EXTERNAL_DEBOUNCE_MS = 400;

export function LocationPickerScreen({ navigation, route }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedPlace[]>([]);
  const [defaults, setDefaults] = useState<SelectedPlace[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(false);

  // Refs for debounce and abort
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const onSelect = (route.params as any)?.onSelect;

  useEffect(() => {
    setDefaults(getDefaultStations());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);

    // Cancel any pending external request
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const q = text.trim();
    if (q.length < 1) {
      setResults([]);
      setLoadingExternal(false);
      return;
    }

    // Instant local search (synchronous)
    const localResults = searchLocalTransitPlaces(q);
    setResults(localResults);

    // Debounced external fallback — only when local is weak
    if (q.length >= 3 && localResults.length < 5) {
      setLoadingExternal(true);
      const controller = new AbortController();
      abortRef.current = controller;

      debounceRef.current = setTimeout(async () => {
        try {
          const merged = await searchPlaces(q, controller.signal);
          if (!controller.signal.aborted) {
            setResults(merged);
          }
        } catch {
          // swallow — stale or failed
        } finally {
          if (!controller.signal.aborted) {
            setLoadingExternal(false);
          }
        }
      }, EXTERNAL_DEBOUNCE_MS);
    } else {
      setLoadingExternal(false);
    }
  }, []);

  const handleSelect = useCallback(
    (place: SelectedPlace) => {
      if (onSelect) onSelect(place);
      navigation.goBack();
    },
    [navigation, onSelect]
  );

  const hasQuery = query.trim().length >= 1;
  const displayData = hasQuery ? results : defaults;

  const sectionTitle = hasQuery
    ? results.length > 0 ? 'Results' : ''
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
        placeholder="Station name, line, or place..."
        autoFocus
      />

      {/* Section header with loading indicator */}
      {sectionTitle ? (
        <View style={styles.sectionRow}>
          <SectionHeader title={sectionTitle} />
          {loadingExternal && (
            <ActivityIndicator
              size="small"
              color={theme.colors.textTertiary}
              style={styles.loadingIndicator}
            />
          )}
        </View>
      ) : null}

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
              {loadingExternal ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.textSecondary}
                  style={{ marginBottom: 12 }}
                />
              ) : null}
              <Text style={styles.emptyText}>
                {loadingExternal ? 'Searching places...' : 'No results found'}
              </Text>
              {!loadingExternal && (
                <Text style={styles.emptyHint}>
                  Try a station name, line code, or address
                </Text>
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginLeft: 8,
    marginBottom: -4,
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
