import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import api from '@/services/api'
import { Colors } from '@/constants/colors'
import { AdminDrawer, useAdminDrawer } from '@/components/ui/AdminDrawer'
import { TopNav } from '@/components/ui/TopNav'

export default function AdminScanScreen() {
  const { visible, open, close } = useAdminDrawer()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(true)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleScan = async ({ data }: { data: string }) => {
    if (!scanning) return
    setScanning(false)
    Vibration.vibrate(100)

    try {
      const res = await api.post('/checkin/scan', { qr_token: data })
      setLastResult({ success: true, message: `✅ Check-in confirmé — Membre #${res.data.utilisateur_id}` })
    } catch (e: any) {
      const detail = e.response?.data?.detail ?? 'QR invalide'
      setLastResult({ success: false, message: `❌ ${detail}` })
    }

    // Re-enable scanning after 2.5s
    setTimeout(() => { setScanning(true); setLastResult(null) }, 2500)
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav title="Scanner QR" subtitle="ADMIN" onMenuPress={open} />
        <View style={styles.center}>
          <Text style={styles.msg}>Chargement de la caméra...</Text>
        </View>
        <AdminDrawer visible={visible} onClose={close} />
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav title="Scanner QR" subtitle="ADMIN" onMenuPress={open} />
        <View style={styles.center}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Accès caméra requis</Text>
          <Text style={styles.permSub}>Pour scanner les QR codes des membres</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnTxt}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
        <AdminDrawer visible={visible} onClose={close} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav title="Scanner QR" subtitle="ADMIN" onMenuPress={open} />

      <View style={styles.scanArea}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanning ? handleScan : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              {/* Corner marks */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            {lastResult ? (
              <View style={[styles.resultBanner, { backgroundColor: lastResult.success ? Colors.success + '22' : Colors.error + '22', borderColor: lastResult.success ? Colors.success : Colors.error }]}>
                <Text style={[styles.resultTxt, { color: lastResult.success ? Colors.success : Colors.error }]}>
                  {lastResult.message}
                </Text>
              </View>
            ) : (
              <Text style={styles.scanHint}>Placez le QR code du membre dans le cadre</Text>
            )}
          </View>
        </View>
      </View>

      <AdminDrawer visible={visible} onClose={close} />
    </SafeAreaView>
  )
}

const FRAME = 240

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.black },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  msg:           { color: Colors.textMuted, fontSize: 15 },
  permIcon:      { fontSize: 56 },
  permTitle:     { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  permSub:       { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  permBtn:       { backgroundColor: Colors.blue, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  permBtnTxt:    { color: '#fff', fontWeight: '800', fontSize: 15 },
  scanArea:      { flex: 1, position: 'relative' },
  overlay:       { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  overlayTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanFrame:     { width: FRAME, height: FRAME },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 24, paddingHorizontal: 32 },
  scanHint:      { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
  resultBanner:  { borderRadius: 12, padding: 16, borderWidth: 1, width: '100%', alignItems: 'center' },
  resultTxt:     { fontWeight: '700', fontSize: 15, textAlign: 'center' },
  corner:        { position: 'absolute', width: 28, height: 28, borderColor: Colors.blue, borderWidth: 3 },
  cornerTL:      { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR:      { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL:      { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR:      { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
})