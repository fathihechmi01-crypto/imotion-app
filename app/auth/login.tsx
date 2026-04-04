import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { login, isLoading } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Champs requis', 'Merci de remplir tous les champs.')
    }

    try {
      const user = await login(email, password)

      if (user.is_admin === 1) {
        router.replace('/admin/dashboard')
      } else {
        router.replace('/member/sessions')
      }
    } catch (e: any) {
      Alert.alert(
        'Connexion échouée',
        e?.response?.data?.detail ?? 'Identifiants invalides'
      )
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Background glow */}
        <LinearGradient
          colors={['rgba(41,171,226,0.18)', 'transparent']}
          style={styles.topGlow}
          pointerEvents="none"
        />

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <LinearGradient
              colors={[Colors.blueLight, Colors.blue]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoI}>i</Text>
            </LinearGradient>
          </View>

          <View>
            <Text style={styles.logoMotion}>motion</Text>
            <Text style={styles.logoClub}>club</Text>
          </View>
        </View>

        <Text style={styles.tagline}>Votre séance vous attend.</Text>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          <Input
            label="Email"
            placeholder="vous@exemple.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register */}
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerLink}>
              Pas encore membre ?{' '}
              <Text style={styles.registerHighlight}>
                Créer un compte
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.bottomAccent}>
          <Text style={styles.bottomText}>
            ⚡ Propulsé par EMS Technology
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.black,
    paddingBottom: 40,
  },

  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },

  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 80,
    paddingHorizontal: 32,
    marginBottom: 8,
  },

  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },

  logoGradient: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoI: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  logoMotion: {
    color: Colors.silver,
    fontSize: 28,
    fontWeight: '800',
  },

  logoClub: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  tagline: {
    color: Colors.textMuted,
    fontSize: 14,
    paddingHorizontal: 32,
    marginBottom: 40,
  },

  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },

  dividerText: {
    color: Colors.textMuted,
    fontSize: 13,
  },

  registerLink: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },

  registerHighlight: {
    color: Colors.blue,
    fontWeight: '700',
  },

  bottomAccent: {
    alignItems: 'center',
    marginTop: 40,
  },

  bottomText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
})