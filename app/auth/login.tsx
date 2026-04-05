import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { API_URL } from '@/constants/api'
import axios from 'axios'

type PingStatus = 'checking' | 'ok' | 'error'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pingStatus, setPingStatus] = useState<PingStatus>('checking')
  const [pingMsg, setPingMsg] = useState('')
  const { login, isLoading } = useAuthStore()

  // ── Connectivity probe ─────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      setPingStatus('checking')
      try {
        const res = await axios.get(API_URL.replace('/api/v1', ''), { timeout: 4000 })
        setPingStatus('ok')
        setPingMsg(`✓ API connectée (${API_URL})`)
      } catch (e: any) {
        setPingStatus('error')
        const detail = e.code === 'ECONNREFUSED'
          ? 'Connexion refusée — le backend est-il démarré ?'
          : e.code === 'ECONNABORTED'
            ? 'Timeout — vérifiez l\'URL et le réseau'
            : e.message ?? 'Erreur inconnue'
        setPingMsg(`✗ ${detail}\n→ ${API_URL}`)
        console.error('[API PING]', e.code, e.message)
      }
    }
    check()
  }, [])

  // ── Login ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Merci de remplir tous les champs.')
      return
    }
    try {
      await login(email.trim(), password)
    } catch (e: any) {
      const status = e.response?.status
      const detail = e.response?.data?.detail
      const code = e.code

      console.error('[LOGIN ERROR]', { status, detail, code, message: e.message })

      if (code === 'ECONNREFUSED' || code === 'ERR_NETWORK') {
        Alert.alert('Serveur inaccessible', `Impossible de joindre le backend.\n\nURL: ${API_URL}\n\nVérifiez que uvicorn tourne et que l'URL est correcte.`)
      } else if (status === 401) {
        Alert.alert('Identifiants incorrects', 'Email ou mot de passe invalide.')
      } else if (status === 422) {
        Alert.alert('Format invalide', `Données rejetées par le serveur:\n${JSON.stringify(detail)}`)
      } else {
        Alert.alert('Erreur', `${status ?? code}: ${JSON.stringify(detail) ?? e.message}`)
      }
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={['rgba(41,171,226,0.18)', 'transparent']} style={styles.topGlow} pointerEvents="none" />

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <LinearGradient colors={[Colors.blueLight, Colors.blue]} style={styles.logoGradient}>
              <Text style={styles.logoI}>i</Text>
            </LinearGradient>
          </View>
          <View>
            <Text style={styles.logoMotion}>motion</Text>
            <Text style={styles.logoClub}>club</Text>
          </View>
        </View>

        <Text style={styles.tagline}>Votre séance vous attend.</Text>

        {/* API status banner */}
        <TouchableOpacity
          style={[
            styles.pingBanner,
            pingStatus === 'ok' && styles.pingOk,
            pingStatus === 'error' && styles.pingError,
            pingStatus === 'checking' && styles.pingChecking,
          ]}
          onPress={() => {
            // show full URL on tap
            Alert.alert('API URL', API_URL)
          }}
        >
          <Text style={[
            styles.pingText,
            pingStatus === 'ok' && { color: Colors.success },
            pingStatus === 'error' && { color: Colors.error },
          ]}>
            {pingStatus === 'checking' ? '⏳ Vérification du serveur...' : pingMsg}
          </Text>
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          <Input
            label="Email"
            placeholder="vous@exemple.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={{ marginBottom: 16 }}
          />
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: 24 }}
          />

          <Button title="Se connecter" onPress={handleLogin} loading={isLoading} size="lg" />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>
              Pas encore membre ?{' '}
              <Text style={{ color: Colors.blue, fontWeight: '700' }}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Debug info */}
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>API: {API_URL}</Text>
          <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: Colors.black, paddingBottom: 40 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 80, paddingHorizontal: 32, marginBottom: 8 },
  logoMark: { width: 52, height: 52, borderRadius: 14 },
  logoGradient: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoI: { color: '#fff', fontSize: 30, fontWeight: '900', fontStyle: 'italic' },
  logoMotion: { color: Colors.silver, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  logoClub: { color: Colors.gold, fontSize: 16, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: -4 },
  tagline: { color: Colors.textMuted, fontSize: 14, paddingHorizontal: 32, marginBottom: 12 },
  // Ping banner
  pingBanner: { marginHorizontal: 20, marginBottom: 16, borderRadius: 10, padding: 10, borderWidth: 1 },
  pingOk: { backgroundColor: Colors.success + '15', borderColor: Colors.success + '40' },
  pingError: { backgroundColor: Colors.error + '15', borderColor: Colors.error + '40' },
  pingChecking: { backgroundColor: Colors.blueDim, borderColor: Colors.border },
  pingText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  // Form
  card: { marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 13 },
  registerLink: { color: Colors.textSecondary, textAlign: 'center', fontSize: 14 },
  // Debug
  debugBox: { marginHorizontal: 20, marginTop: 20, padding: 10, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  debugText: { color: Colors.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
})