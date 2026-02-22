import React, { useEffect, useMemo, useState, } from 'react';
import { Image, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { NativeModules } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { ensureToken } from './src/storage/token';
import QrPngExporter from './src/components/QRPngExporter';
import QrScannerModal from './src/components/QrScannerModal';
const { AlarmModule } = NativeModules;
import { Appearance } from 'react-native';

Appearance.setColorScheme('light');
function nextTriggerTimeMillis(hour, minute) {
  const now = new Date();
  const t = new Date();
  t.setSeconds(0, 0);
  t.setHours(hour);
  t.setMinutes(minute);

  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
  return t.getTime();
}

export default function App() {
  const [token, setToken] = useState(null);

  const [hour, setHour] = useState(new Date().getHours());
  const [minute, setMinute] = useState((new Date().getMinutes() + 1) % 60);
  const [scannerOpen, setScannerOpen] = useState(false);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  useEffect(() => {
    (async () => {
      const t = await ensureToken();   
      setToken(t);
    })();
  }, []);

  const scheduleAlarm = () => {
    AlarmModule.requestExactAlarmPermission?.();
    const trigger = nextTriggerTimeMillis(hour, minute);
    AlarmModule.scheduleAlarm(trigger);

    Alert.alert('Alarm set', `Scheduled for: ${new Date(trigger).toLocaleString()}`);
  };

  const stop = () => {
    AlarmModule.stopAlarm();
    Alert.alert('Stopped', 'Alarm stopped.');
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('./src/icon.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Wake TF Up Quels</Text>


      <QrPngExporter token={token} label="Save QR" />

      {/* Time Picker */}
      <View style={styles.pickerRow}>
        <View style={styles.pickerBox}>
          <Text style={styles.pickerLabel}>Hour</Text>
          <Picker selectedValue={hour} onValueChange={setHour}>
            {hours.map(h => (
              <Picker.Item key={h} label={String(h).padStart(2, '0')} value={h} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerBox}>
          <Text style={styles.pickerLabel}>Minute</Text>
          <Picker selectedValue={minute} onValueChange={setMinute}>
            {minutes.map(m => (
              <Picker.Item key={m} label={String(m).padStart(2, '0')} value={m} />
            ))}
          </Picker>
        </View>
      </View>

      <Pressable style={styles.btn} onPress={scheduleAlarm}>
        <Text style={styles.btnText}>Set Alarm</Text>
      </Pressable>

      <Pressable style={[styles.btn, { backgroundColor: '#444' }]} onPress={() => setScannerOpen(true)}>
        <Text style={styles.btnText}>Scan QR to Stop Alarm</Text>
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
  sub: { opacity: 0.8, textAlign: 'center', marginBottom: 6 },

  btn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#222', minWidth: 260 },
  btnText: { color: 'white', fontSize: 16, textAlign: 'center' },

  hint2: { marginTop: 10, opacity: 0.7, textAlign: 'center' },

  pickerRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  pickerBox: { width: 140, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  pickerLabel: { textAlign: 'center', paddingTop: 8, fontWeight: '700' },
  logo: {
  width: 150,
  height: 150,
  resizeMode: 'contain',
  marginBottom: 12,
},
});