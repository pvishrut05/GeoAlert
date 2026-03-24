import React, { useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AlarmRow, EmptyState } from '../components';
import { useAlarmStore } from '../store';
import { useAppInit } from '../hooks';
import { Alarm } from '../types';
import { theme } from '../constants';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AlarmsList'>;
};

export function AlarmsListScreen({ navigation }: Props) {
  useAppInit();

  const alarms = useAlarmStore((s) => s.alarms);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);

  const handlePress = useCallback(
    (alarm: Alarm) => {
      navigation.navigate('EditAlarm', { alarmId: alarm.id });
    },
    [navigation]
  );

  const handleAdd = useCallback(() => {
    navigation.navigate('AddAlarm');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: Alarm; index: number }) => (
      <AlarmRow
        alarm={item}
        onToggle={toggleAlarm}
        onPress={handlePress}
        isLast={index === alarms.length - 1}
      />
    ),
    [alarms.length, toggleAlarm, handlePress]
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} onPress={handleAdd}>
            <Text style={styles.addButton}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Alarms</Text>
      </View>

      {/* List */}
      {alarms.length === 0 ? (
        <EmptyState
          message="No alarms yet"
          actionLabel="Add Alarm"
          onAction={handleAdd}
        />
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  editButton: {
    fontSize: theme.font.size.headline,
    color: theme.colors.accent,
    fontWeight: theme.font.weight.regular,
  },
  addButton: {
    fontSize: 28,
    color: theme.colors.accent,
    fontWeight: '300',
    lineHeight: 32,
  },
  title: {
    fontSize: theme.font.size.largeTitle,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  list: {
    paddingTop: theme.spacing.sm,
  },
});
