import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAlarmStore } from '../store';
import { theme } from '../constants';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AlarmTrigger'>;
  route: RouteProp<RootStackParamList, 'AlarmTrigger'>;
};

const { width } = Dimensions.get('window');

export function AlarmTriggerScreen({ navigation, route }: Props) {
  const alarm = useAlarmStore((s) =>
    s.alarms.find((a) => a.id === route.params.alarmId)
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, fadeAnim]);

  const handleStop = () => {
    navigation.goBack();
  };

  const handleSnooze = () => {
    // Stub: re-register geofence with delay
    navigation.goBack();
  };

  if (!alarm) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Alarm not found</Text>
      </View>
    );
  }

  const actionText =
    alarm.triggerType === 'arriving' ? 'arriving at' : 'leaving';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Pulsing ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={styles.innerCircle}>
          <Text style={styles.pinEmoji}>📍</Text>
        </View>
      </Animated.View>

      {/* Info */}
      <Text style={styles.label}>{alarm.label}</Text>
      <Text style={styles.subtitle}>
        You're {actionText} {alarm.address || alarm.locationName}
      </Text>

      {/* Stop button */}
      <TouchableOpacity
        style={styles.stopButton}
        activeOpacity={0.8}
        onPress={handleStop}
      >
        <Text style={styles.stopText}>Stop</Text>
      </TouchableOpacity>

      {/* Snooze */}
      <TouchableOpacity
        style={styles.snoozeButton}
        activeOpacity={0.7}
        onPress={handleSnooze}
      >
        <Text style={styles.snoozeText}>Snooze</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxxl,
  },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: theme.font.size.body,
  },
  pulseRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(52,199,89,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(52,199,89,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinEmoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 32,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.font.size.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 56,
  },
  stopButton: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: width * 0.24,
    backgroundColor: theme.colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.destructive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  stopText: {
    fontSize: 22,
    fontWeight: theme.font.weight.semibold,
    color: '#fff',
    letterSpacing: -0.2,
  },
  snoozeButton: {
    marginTop: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  snoozeText: {
    fontSize: theme.font.size.callout,
    color: 'rgba(255,255,255,0.55)',
  },
});
