import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  ScreenContainer,
  SectionHeader,
  SegmentedControl,
  RadiusSelector,
  SettingRow,
  PrimaryButton,
} from '../components';
import { useAlarmStore } from '../store';
import { theme, soundOptions } from '../constants';
import { RootStackParamList } from '../navigation/types';

type AddProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddAlarm'>;
};

type EditProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditAlarm'>;
  route: RouteProp<RootStackParamList, 'EditAlarm'>;
};

type Props = AddProps | EditProps;

function isEditProps(props: Props): props is EditProps {
  return 'route' in props && !!props.route?.params?.alarmId;
}

export function AlarmFormScreen(props: Props) {
  const { navigation } = props;
  const alarmId = isEditProps(props) ? props.route.params.alarmId : null;
  const isEditing = !!alarmId;

  const existingAlarm = useAlarmStore((s) =>
    alarmId ? s.alarms.find((a) => a.id === alarmId) : undefined
  );

  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);

  // Form state
  const [label, setLabel] = useState(existingAlarm?.label ?? '');
  const [locationName, setLocationName] = useState(existingAlarm?.locationName ?? '');
  const [address, setAddress] = useState(existingAlarm?.address ?? '');
  const [latitude, setLatitude] = useState(existingAlarm?.latitude ?? 41.8786);
  const [longitude, setLongitude] = useState(existingAlarm?.longitude ?? -87.6402);
  const [triggerType, setTriggerType] = useState<'arriving' | 'leaving'>(
    existingAlarm?.triggerType ?? 'arriving'
  );
  const [radius, setRadius] = useState(existingAlarm?.radius ?? 200);
  const [sound, setSound] = useState(existingAlarm?.sound ?? 'radar');
  const [vibrationEnabled, setVibrationEnabled] = useState(
    existingAlarm?.vibrationEnabled ?? true
  );

  const isValid = useMemo(() => label.trim().length > 0, [label]);

  const handleSave = useCallback(() => {
    if (!isValid) return;

    const data = {
      label: label.trim(),
      locationName: locationName.trim() || label.trim(),
      address: address.trim(),
      latitude,
      longitude,
      radius,
      triggerType,
      sound,
      vibrationEnabled,
      isEnabled: existingAlarm?.isEnabled ?? true,
    };

    if (isEditing && alarmId) {
      updateAlarm(alarmId, data);
    } else {
      addAlarm(data);
    }

    navigation.goBack();
  }, [
    isValid, label, locationName, address, latitude, longitude,
    radius, triggerType, sound, vibrationEnabled,
    isEditing, alarmId, existingAlarm, addAlarm, updateAlarm, navigation,
  ]);

  const handleDelete = useCallback(() => {
    if (!alarmId) return;
    Alert.alert('Delete Alarm', `Remove "${label}" alarm?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAlarm(alarmId);
          navigation.goBack();
        },
      },
    ]);
  }, [alarmId, label, deleteAlarm, navigation]);

  const handleLocationPick = useCallback(() => {
    navigation.navigate('LocationPicker', {
      onSelect: (result: any) => {
        // SelectedPlace uses 'label' and 'locationName'
        const name = result.locationName || result.label || result.name || '';
        setLocationName(name);
        setAddress(result.address || '');
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        // Auto-fill label if empty
        if (!label.trim() && name) {
          setLabel(name);
        }
      },
    } as any);
  }, [navigation, label]);

  const triggerIndex = triggerType === 'arriving' ? 0 : 1;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Alarm' : 'New Alarm'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!isValid}>
            <Text style={[styles.saveButton, !isValid && styles.saveDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Label */}
          <SectionHeader title="Label" />
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Work, Home, Gym"
              placeholderTextColor={theme.colors.textTertiary}
              autoFocus={!isEditing}
            />
          </View>

          {/* Location */}
          <SectionHeader title="Location" />
          <TouchableOpacity
            style={styles.inputWrapper}
            activeOpacity={0.6}
            onPress={handleLocationPick}
          >
            <View style={{ flex: 1, paddingVertical: 10 }}>
              {locationName ? (
                <>
                  <Text style={styles.input} numberOfLines={1}>
                    {locationName}
                  </Text>
                  {!!address && (
                    <Text
                      style={{
                        fontSize: theme.font.size.caption,
                        color: theme.colors.textSecondary,
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {address}
                    </Text>
                  )}
                </>
              ) : (
                <Text
                  style={[styles.input, { color: theme.colors.textTertiary }]}
                  numberOfLines={1}
                >
                  Search for a place...
                </Text>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Trigger When */}
          <SectionHeader title="Trigger When" />
          <View style={styles.segmentWrapper}>
            <SegmentedControl
              options={['Arriving', 'Leaving']}
              selectedIndex={triggerIndex}
              onChange={(i) => setTriggerType(i === 0 ? 'arriving' : 'leaving')}
            />
          </View>

          {/* Radius */}
          <SectionHeader title="Trigger Radius" />
          <View style={styles.sliderWrapper}>
            <RadiusSelector value={radius} onChange={setRadius} />
          </View>

          {/* Sound */}
          <SectionHeader title="Sound" />
          <View style={styles.soundList}>
            {soundOptions.map((s, i) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.soundRow,
                  i < soundOptions.length - 1 && styles.soundRowBorder,
                ]}
                activeOpacity={0.6}
                onPress={() => setSound(s)}
              >
                <Text style={styles.soundLabel}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
                {sound === s && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Vibration */}
          <View style={styles.vibrationRow}>
            <SettingRow
              label="Vibration"
              showSwitch
              switchValue={vibrationEnabled}
              onSwitchChange={setVibrationEnabled}
              isLast
            />
          </View>

          {/* Delete */}
          {isEditing && (
            <View style={styles.deleteWrapper}>
              <PrimaryButton
                title="Delete Alarm"
                variant="destructive"
                onPress={handleDelete}
              />
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveButton: {
    fontSize: theme.font.size.callout,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.accent,
  },
  saveDisabled: {
    opacity: 0.35,
  },
  form: {
    paddingBottom: theme.spacing.xxxl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.xl,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  chevron: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  segmentWrapper: {
    paddingHorizontal: theme.spacing.xl,
  },
  sliderWrapper: {
    paddingHorizontal: theme.spacing.xl,
  },
  soundList: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  soundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  soundRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  soundLabel: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  checkmark: {
    fontSize: 16,
    color: theme.colors.accent,
    fontWeight: theme.font.weight.semibold,
  },
  vibrationRow: {
    marginTop: theme.spacing.lg,
  },
  deleteWrapper: {
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xxxl,
  },
});
