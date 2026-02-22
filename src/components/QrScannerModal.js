import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QrScannerModal({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lastDataRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      lastDataRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    if (visible && permission?.status !== 'granted') {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleBarcode = ({ data }) => {
    if (scanned) return;

    // prevent duplicate rapid-fires
    if (lastDataRef.current === data) return;
    lastDataRef.current = data;

    setScanned(true);
    onScanned?.(data);
  };

  const canUseCamera = permission?.status === 'granted';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Text style={styles.title}>Scan the sink QR</Text>

        {!canUseCamera ? (
          <View style={styles.center}>
            <Text style={styles.text}>Camera permission is required.</Text>
            <Pressable style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Allow Camera</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnGray]} onPress={onClose}>
              <Text style={styles.btnText}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcode}
            />

            <View style={styles.footer}>
              <Pressable style={[styles.btn, styles.btnGray]} onPress={onClose}>
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>

              {scanned && (
                <Pressable style={styles.btn} onPress={() => setScanned(false)}>
                  <Text style={styles.btnText}>Scan Again</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', padding: 16, textAlign: 'center' },
  camera: { flex: 1 },
  footer: { padding: 16, flexDirection: 'row', gap: 12, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
  text: { color: '#fff', opacity: 0.9, textAlign: 'center' },
  btn: { backgroundColor: '#222', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  btnGray: { backgroundColor: '#444' },
  btnText: { color: '#fff', fontWeight: '700' },
});