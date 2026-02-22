import React, { useEffect, useMemo, useState } from 'react';
import { Image, View, Text, Pressable, StyleSheet, Alert, useColorScheme } from 'react-native';
import { NativeModules } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { ensureToken } from './src/storage/token';
import QrPngExporter from './src/components/QRPngExporter';
import QrScannerModal from './src/components/QrScannerModal';

import { getThemeMode, setThemeMode } from './src/storage/theme';

const { AlarmModule } = NativeModules;

function nextTriggerTimeMillis(hour, minute) {
  const now = new Date();
  const t = new Date();
  t.setSeconds(0, 0);
  t.setHours(hour);
  t.setMinutes(minute);
  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
  return t.getTime();
}

const THEME = {
  light: {
    bg: '#FFFFFF',
    text: '#111111',
    card: '#F3F4F6',
    border: '#D1D5DB',
    btn: '#111111',
    btnAlt: '#374151',
    btnText: '#FFFFFF',
  },
  dark: {
    bg: '#0B0F14',
    text: '#E5E7EB',
    card: '#121A22',
    border: '#243244',
    btn: '#E5E7EB',
    btnAlt: '#94A3B8',
    btnText: '#0B0F14',
  },
};

export default function App() {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setMode] = useState(systemScheme === 'dark' ? 'dark' : 'light');
  const colors = THEME[mode];

  const [token, setToken] = useState(null);
  const [hour, setHour] = useState(new Date().getHours());
  const [minute, setMinute] = useState((new Date().getMinutes() + 1) % 60);
  const [scannerOpen, setScannerOpen] = useState(false);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  useEffect(() => {
    (async () => {
      // token
      const t = await ensureToken();
      setToken(t);

      // theme: load saved preference, otherwise use system default
      const saved = await getThemeMode();
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      } else {
        const fallback = systemScheme === 'dark' ? 'dark' : 'light';
        setMode(fallback);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = async () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    await setThemeMode(next);
  };

  const scheduleAlarm = () => {
    AlarmModule.requestExactAlarmPermission?.();
    const trigger = nextTriggerTimeMillis(hour, minute);
    AlarmModule.scheduleAlarm(trigger);
    Alert.alert('Alarm set', `Scheduled for: ${new Date(trigger).toLocaleString()}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Theme toggle */}
      <Pressable
        style={[styles.themeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={toggleTheme}
      >
        <Text style={{ color: colors.text, fontWeight: '800' }}>
          Theme: {mode === 'light' ? 'Light' : 'Dark'}
        </Text>
      </Pressable>

      <Image source={require('./src/icon.png')} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Wake TF Up Quels</Text>

      <QrPngExporter token={token} label="Save QR" />

      {/* Time Picker */}
      <View style={styles.pickerRow}>
        <View style={[styles.pickerBox, { borderColor: colors.border, backgroundColor: colors.card ,  }]}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Hour</Text>
          <Picker
            selectedValue={hour}
            onValueChange={setHour}
            mode="dropdown"
            dropdownIconColor={colors.text}
            style={{ color: colors.text, backgroundColor: colors.card }}
            itemStyle={{ color: colors.text }}   // iOS mostly
          >
            {hours.map(h => (
              <Picker.Item key={h} label={String(h).padStart(2, '0')} value={h} />
            ))}
          </Picker>
        </View>

        <View style={[styles.pickerBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Minute</Text>
          <Picker
            selectedValue={minute}
            onValueChange={setMinute}
            mode="dropdown"
            dropdownIconColor={colors.text}
            style={{ color: colors.text, backgroundColor: colors.card }}
            itemStyle={{ color: colors.text }}   // iOS mostly
          >
            {minutes.map(m => (
              <Picker.Item key={m} label={String(m).padStart(2, '0')} value={m} />
            ))}
          </Picker>
        </View>
      </View>

      <Pressable style={[styles.btn, { backgroundColor: colors.btn }]} onPress={scheduleAlarm}>
        <Text style={[styles.btnText, { color: colors.btnText }]}>Set Alarm</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, { backgroundColor: colors.btnAlt }]}
        onPress={() => setScannerOpen(true)}
      >
        <Text style={[styles.btnText, { color: colors.btnText }]}>Scan QR to Stop Alarm</Text>
      </Pressable>

      <QrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(data) => {
          if (data === token) {
            AlarmModule.stopAlarm();
            setScannerOpen(false);
            Alert.alert('Stopped', 'Correct QR scanned. Alarm stopped.');
          } else {
            Alert.alert('Wrong QR', 'That is not your QR. Try again.');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  title: { fontSize: 22, fontWeight: '900' },

  btn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, minWidth: 260 },
  btnText: { fontSize: 16, textAlign: 'center', fontWeight: '800' },

  pickerRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  pickerBox: { width: 140, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  pickerLabel: { textAlign: 'center', paddingTop: 8, fontWeight: '700' },

  logo: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 12 },

  themeBtn: {
    position: 'absolute',
    top: 40,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});