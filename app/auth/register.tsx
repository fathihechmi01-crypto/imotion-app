import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { authService } from '@/services/auth.service'
import { Colors } from '@/constants/colors'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterScreen() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!nom || !email || !password) return Alert.alert('Champs requis', 'Nom, email et mot de passe sont obligatoires.')
    setLoading(true)
    try {
      await authService.register({ nom, email, mot_de_passe: password, telephone })
      Alert.alert('Compte créé !', 'Vous pouvez maintenant vous connecter.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ])
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail ?? 'Impossible de créer le compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez iMotion Club et commencez dès aujourd'hui.</Text>
        </View>

        <View style={styles.card}>
          <Input label="Nom complet" placeholder="Votre nom" value={nom} onChangeText={setNom} autoCapitalize="words" style={{ marginBottom: 16 }} />
          <Input label="Email" placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" style={{ marginBottom: 16 }} />
          <Input label="Téléphone" placeholder="+216 XX XXX XXX" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" style={{ marginBottom: 16 }} />
          <Input label="Mot de passe" placeholder="8 caractères minimum" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 28 }} />

          <Button title="Créer mon compte" onPress={handleRegister} loading={loading} size="lg" />
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 24, alignItems: 'center' }}>
          <Text style={styles.loginLink}>
            Déjà membre ?{' '}
            <Text style={{ color: Colors.blue, fontWeight: '700' }}>Se connecter</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll:     { flexGrow: 1, backgroundColor: Colors.black, paddingBottom: 40 },
  header:     { paddingTop: 60, paddingHorizontal: 24, marginBottom: 32 },
  back:       { marginBottom: 24 },
  backText:   { color: Colors.blue, fontSize: 15, fontWeight: '600' },
  title:      { color: Colors.textPrimary, fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle:   { color: Colors.textMuted, fontSize: 14 },
  card:       { marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  loginLink:  { color: Colors.textSecondary, fontSize: 14 },
})
