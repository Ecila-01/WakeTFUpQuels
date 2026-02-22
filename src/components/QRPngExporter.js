import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { AppState } from 'react-native';
export default function QrPngExporter({ token, label = 'Save QR' }) {
  const shotRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const exportPng = async () => {
    try {
      if (!token) {
        Alert.alert('Token not ready', 'Try again in a second.');
        return;
      }
      if (!shotRef.current) {
        Alert.alert('Not ready', 'QR renderer not ready yet.');
        return;
      }

      // Make sure we're in foreground (Activity exists)
      if (AppState.currentState !== 'active') {
        // Don't alert here (it might also fail if activity is gone)
        console.log('Share blocked: app not active');
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        return;
      }

      setBusy(true);

      const uri = await shotRef.current.capture();

      // Give Android a moment to "settle" before opening share sheet
      await new Promise((r) => setTimeout(r, 250));

      // Check again before opening share sheet
      if (AppState.currentState !== 'active') {
        console.log('Share cancelled: app became inactive');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'WakeTFUp QR',
      });
    } catch (e) {
      console.log(e);
      // Avoid Alert if activity is gone
      if (AppState.currentState === 'active') {
        Alert.alert('Export failed', String(e));
      }
    } finally {
      setBusy(false);
    
    }
  };
  const saveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow storage permission to save QR.');
        return;
      }

      const uri = await shotRef.current.capture();

      const asset = await MediaLibrary.createAssetAsync(uri);

      await MediaLibrary.createAlbumAsync(
        'WakeTFUp',
        asset,
        false
      );

      Alert.alert('Saved', 'QR saved to Gallery (WakeTFUp album).');

    } catch (e) {
      Alert.alert('Save failed', String(e));
    }
  };
  return (
    <View>
      {/* Hidden/off-screen render for capture */}
      <View style={styles.offscreen}>
        <ViewShot
          ref={shotRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        >
          <View style={styles.card}>
            <Text style={styles.title}>WAKE UP</Text>
            <QRCode value={token || '...'} size={240} />
          </View>
        </ViewShot>
      </View>

      <Pressable
        style={[styles.btn, busy && styles.btnDisabled]}
        onPress={saveToGallery}
        disabled={busy}
      >
        <Text style={styles.btnText}>{busy ? 'Preparing…' : label}</Text>
      </Pressable>
      
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '900', color: '#000' },
  token: { fontSize: 10, color: '#333' },
  note: { fontSize: 12, color: '#111' },

  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#222',
    minWidth: 260,
    alignSelf: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 16, textAlign: 'center' },
});