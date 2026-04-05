import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import api from '@/services/api'

const OBJECTIFS = ['Perte de poids', 'Prise de masse', 'Cardio & endurance', 'Tonification', 'Bien-être', 'Performance']

export default function ProfileScreen() {
  const { user, logout, loadUser } = useAuthStore()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)

  // Edit form state
  const [nom, setNom]           = useState(user?.nom ?? '')
  const [telephone, setTel]     = useState(user?.telephone ?? '')
  const [poids, setPoids]       = useState(user?.poids?.toString() ?? '')
  const [taille, setTaille]     = useState(user?.taille?.toString() ?? '')
  const [objectif, setObjectif] = useState(user?.objectif ?? '')

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put('/users/me', body).then(r => r.data),
    onSuccess: () => {
      loadUser()
      setShowEdit(false)
      Alert.alert('✅ Profil mis à jour !')
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Mise à jour impossible'),
  })

  const handleLogout = () =>
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ])

  const handleSave = () => {
    updateMutation.mutate({
      nom: nom.trim(),
      telephone: telephone.trim(),
      poids: poids ? parseFloat(poids) : null,
      taille: taille ? parseFloat(taille) : null,
      objectif: objectif || null,
    })
  }

  if (!user) return null

  const bmi = user.poids && user.taille
    ? (user.poids / ((user.taille / 100) ** 2)).toFixed(1)
    : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <LinearGradient colors={['rgba(41,171,226,0.15)', 'transparent']} style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[Colors.blueLight, Colors.blue, Colors.blueDark]} style={StyleSheet.absoluteFill} />
            <Text style={styles.avatarText}>{user.nom.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.nom}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.is_flagged && (
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>⚠️ Compte signalé — {user.no_show_count} absence{user.no_show_count > 1 ? 's' : ''}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => { setNom(user.nom); setTel(user.telephone ?? ''); setPoids(user.poids?.toString() ?? ''); setTaille(user.taille?.toString() ?? ''); setObjectif(user.objectif ?? ''); setShowEdit(true) }}>
            <Text style={styles.editBtnText}>✏️ Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Fitness stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MES STATS</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard} elevated>
              <Text style={styles.statVal}>{user.poids ? `${user.poids}` : '—'}</Text>
              <Text style={styles.statUnit}>kg</Text>
              <Text style={styles.statLbl}>Poids</Text>
            </Card>
            <Card style={styles.statCard} elevated>
              <Text style={styles.statVal}>{user.taille ? `${user.taille}` : '—'}</Text>
              <Text style={styles.statUnit}>cm</Text>
              <Text style={styles.statLbl}>Taille</Text>
            </Card>
            <Card style={styles.statCard} elevated>
              <Text style={styles.statVal}>{bmi ?? '—'}</Text>
              <Text style={styles.statUnit}>IMC</Text>
              <Text style={styles.statLbl}>Indice</Text>
            </Card>
          </View>
        </View>

        {/* Objectif */}
        {user.objectif && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OBJECTIF</Text>
            <Card elevated>
              <View style={styles.objectifRow}>
                <Text style={styles.objectifIcon}>🎯</Text>
                <Text style={styles.objectifText}>{user.objectif}</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTACT</Text>
          <Card elevated style={{ gap: 10 }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 }]}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{user.telephone ?? '—'}</Text>
            </View>
          </Card>
        </View>

        {/* No-show */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ASSIDUITÉ</Text>
          <Card elevated>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Absences non justifiées</Text>
              <Text style={[styles.infoValue, user.no_show_count > 0 && { color: Colors.warning }]}>
                {user.no_show_count} / 3
              </Text>
            </View>
            {user.no_show_count > 0 && (
              <View style={styles.noShowBar}>
                <View style={[styles.noShowFill, { width: `${Math.min(100, user.no_show_count / 3 * 100)}%` as any, backgroundColor: user.no_show_count >= 3 ? Colors.error : Colors.warning }]} />
              </View>
            )}
          </Card>
        </View>

        <View style={[styles.section, { marginTop: 8 }]}>
          <Button title="Se déconnecter" onPress={handleLogout} variant="danger" />
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Modifier le profil</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Nom" value={nom} onChangeText={setNom} autoCapitalize="words" style={styles.field} />
              <Input label="Téléphone" value={telephone} onChangeText={setTel} keyboardType="phone-pad" style={styles.field} />
              <View style={styles.row}>
                <Input label="Poids (kg)" value={poids} onChangeText={setPoids} keyboardType="decimal-pad" style={{ flex: 1, marginRight: 8 }} />
                <Input label="Taille (cm)" value={taille} onChangeText={setTaille} keyboardType="decimal-pad" style={{ flex: 1 }} />
              </View>

              <Text style={styles.fieldLabel}>Objectif</Text>
              <View style={styles.objectifPicker}>
                {OBJECTIFS.map(o => (
                  <TouchableOpacity key={o} style={[styles.objChip, objectif === o && styles.objChipActive]} onPress={() => setObjectif(o)}>
                    <Text style={[styles.objChipText, objectif === o && styles.objChipTextActive]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.sheetActions}>
                <Button title="Annuler" onPress={() => setShowEdit(false)} variant="ghost" style={{ flex: 1 }} />
                <Button title="Enregistrer" onPress={handleSave} loading={updateMutation.isPending} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  heroGlow:       { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  hero:           { alignItems: 'center', paddingTop: 32, paddingBottom: 24, gap: 8 },
  avatarWrap:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  avatarText:     { color: '#fff', fontSize: 32, fontWeight: '900' },
  name:           { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  email:          { color: Colors.textMuted, fontSize: 14 },
  flagBadge:      { backgroundColor: Colors.warning + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.warning },
  flagText:       { color: Colors.warning, fontSize: 12, fontWeight: '700' },
  editBtn:        { backgroundColor: Colors.blueDim, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: Colors.blue, marginTop: 4 },
  editBtnText:    { color: Colors.blue, fontWeight: '700', fontSize: 14 },
  section:        { paddingHorizontal: 20, marginBottom: 16 },
  sectionLabel:   { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  statsGrid:      { flexDirection: 'row', gap: 10 },
  statCard:       { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 2 },
  statVal:        { color: Colors.textPrimary, fontSize: 22, fontWeight: '900' },
  statUnit:       { color: Colors.blue, fontSize: 11, fontWeight: '700' },
  statLbl:        { color: Colors.textMuted, fontSize: 10 },
  objectifRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  objectifIcon:   { fontSize: 24 },
  objectifText:   { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:      { color: Colors.textSecondary, fontSize: 14 },
  infoValue:      { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  noShowBar:      { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  noShowFill:     { height: 6, borderRadius: 3 },
  // Modal
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%', borderTopWidth: 1, borderColor: Colors.border },
  sheetHandle:    { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:     { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  field:          { marginBottom: 16 },
  row:            { flexDirection: 'row', marginBottom: 16 },
  fieldLabel:     { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  objectifPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  objChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  objChipActive:  { backgroundColor: Colors.blueDim, borderColor: Colors.blue },
  objChipText:    { color: Colors.textSecondary, fontSize: 13 },
  objChipTextActive:{ color: Colors.blue, fontWeight: '700' },
  sheetActions:   { flexDirection: 'row', gap: 12, marginTop: 8 },
})
