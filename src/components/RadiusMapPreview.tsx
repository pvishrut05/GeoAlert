import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { theme } from '../constants';

interface Props {
  latitude: number;
  longitude: number;
  /** Radius in meters. */
  radiusMeters: number;
}

/**
 * Compact map preview showing the alarm trigger zone as a radius circle.
 * Uses Apple Maps (the default MapView provider on iOS).
 * Non-interactive — display only.
 */
export function RadiusMapPreview({ latitude, longitude, radiusMeters }: Props) {
  const region = useMemo(() => {
    // Frame the circle with comfortable padding (~2.5× radius)
    const padded = radiusMeters * 2.5;
    const latDelta = padded / 111320;
    const lngDelta = padded / (111320 * Math.cos((latitude * Math.PI) / 180));
    return {
      latitude,
      longitude,
      latitudeDelta: Math.max(latDelta, 0.003),
      longitudeDelta: Math.max(lngDelta, 0.003),
    };
  }, [latitude, longitude, radiusMeters]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        // No provider prop = Apple Maps on iOS (default)
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        userInterfaceStyle="dark"
        pointerEvents="none"
      >
        <Circle
          center={{ latitude, longitude }}
          radius={radiusMeters}
          strokeWidth={1.5}
          strokeColor="rgba(52, 199, 89, 0.6)"
          fillColor="rgba(52, 199, 89, 0.12)"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    height: 160,
    backgroundColor: theme.colors.surface,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
