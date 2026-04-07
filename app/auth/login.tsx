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

type Ping = 'checking' | 'ok' | 'error'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [ping,     setPing]     = useState<Ping>('checking')
  const [pingMsg,  setPingMsg]  = useState('')
  const { login, isLoading, isAuthenticated, user } = useAuthStore()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.is_admin === 1) router.replace('/admin/dashboard')
      else router.replace('/member/sessions')
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    axios.get(API_URL.replace('/api/v1', '') + '/health', { timeout: 4000 })
      .then(() => { setPing('ok'); setPingMsg(`✓ Serveur connecté`) })
      .catch((e) => {
        setPing('error')
        setPingMsg(`✗ Serveur inaccessible — ${e.code ?? e.message}`)
      })
  }, [])

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Requis', 'Email et mot de passe obligatoires.')
    try {
      await login(email.trim(), password)
      // Redirect handled by useEffect above
    } catch (e: any) {
      const status = e.response?.status
      const detail = e.response?.data?.detail
      if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK') {
        Alert.alert('Serveur inaccessible', `URL: ${API_URL}`)
      } else if (status === 401) {
        Alert.alert('Identifiants incorrects', 'Email ou mot de passe invalide.')
      } else {
        Alert.alert('Erreur', `${status ?? e.code}: ${JSON.stringify(detail) ?? e.message}`)
      }
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['rgba(41,171,226,0.18)', 'transparent']} style={styles.glow} pointerEvents="none" />

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <LinearGradient colors={[Colors.blueLight, Colors.blue]} style={styles.logoGrad}>
              <Text style={styles.logoI}>i</Text>
            </LinearGradient>
          </View>
          <View>
            <Text style={styles.logoMotion}>motion</Text>
            <Text style={styles.logoClub}>club</Text>
          </View>
        </View>
        <Text style={styles.tagline}>Votre séance vous attend.</Text>

        {/* API status */}
        <View style={[styles.pingBanner,
          ping === 'ok'       && styles.pingOk,
          ping === 'error'    && styles.pingErr,
          ping === 'checking' && styles.pingWait,
        ]}>
          <Text style={[styles.pingTxt,
            ping === 'ok'    && { color: Colors.success },
            ping === 'error' && { color: Colors.error },
          ]}>
            {ping === 'checking' ? '⏳ Vérification...' : pingMsg}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Input label="Email" placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" style={{ marginBottom: 16 }} />
          <Input label="Mot de passe" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 24 }} />
          <Button title="Se connecter" onPress={handleLogin} loading={isLoading} size="lg" />
          <View style={styles.divider}>
            <View style={styles.dividerLine} /><Text style={styles.dividerTxt}>ou</Text><View style={styles.dividerLine} />
          </View>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>
              Pas encore membre ?{' '}
              <Text style={{ color: Colors.blue, fontWeight: '700' }}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.debugTxt}>{API_URL}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const S = StyleSheet
const styles = S.create({
  scroll:       { flexGrow: 1, backgroundColor: Colors.black, paddingBottom: 40 },
  glow:         { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  logoArea:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 80, paddingHorizontal: 32, marginBottom: 8 },
  logoMark:     { width: 52, height: 52, borderRadius: 14, overflow: 'hidden' },
  logoGrad:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoI:        { color: '#fff', fontSize: 30, fontWeight: '900', fontStyle: 'italic' },
  logoMotion:   { color: Colors.silver, fontSize: 28, fontWeight: '800' },
  logoClub:     { color: Colors.gold, fontSize: 16, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  tagline:      { color: Colors.textMuted, fontSize: 14, paddingHorizontal: 32, marginBottom: 16 },
  pingBanner:   { marginHorizontal: 20, marginBottom: 16, borderRadius: 10, padding: 10, borderWidth: 1 },
  pingOk:       { backgroundColor: Colors.success + '15', borderColor: Colors.success + '40' },
  pingErr:      { backgroundColor: Colors.error + '15', borderColor: Colors.error + '40' },
  pingWait:     { backgroundColor: Colors.blueDim, borderColor: Colors.border },
  pingTxt:      { color: Colors.textSecondary, fontSize: 12 },
  card:         { marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  cardTitle:    { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 24 },
  divider:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt:   { color: Colors.textMuted, fontSize: 13 },
  registerLink: { color: Colors.textSecondary, textAlign: 'center', fontSize: 14 },
  debugTxt:     { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 20 },
})