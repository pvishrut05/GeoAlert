export type RootStackParamList = {
  MainTabs: undefined;
  AddAlarm: undefined;
  EditAlarm: { alarmId: string };
  LocationPicker: { onSelect?: (result: any) => void };
  AlarmTrigger: { alarmId: string };
};

export type TabParamList = {
  AlarmsList: undefined;
  Settings: undefined;
};
