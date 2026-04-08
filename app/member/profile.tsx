import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Image, Platform, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TopNav } from '@/components/ui/TopNav'
import { MemberDrawer, useMemberDrawer } from '@/components/ui/MemberDrawer'
import api from '@/services/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const OBJECTIFS = ['Perte de poids', 'Prise de masse', 'Cardio & endurance', 'Tonification', 'Bien-être', 'Performance']
const { width } = Dimensions.get('window')

export default function ProfileScreen() {
  const { visible, open, close } = useMemberDrawer()
  const { user, logout, loadUser } = useAuthStore()
  const qc = useQueryClient()

  const [showEdit,   setShowEdit]   = useState(false)
  const [showWeight, setShowWeight] = useState(false)
  const [nom,        setNom]        = useState(user?.nom ?? '')
  const [telephone,  setTel]        = useState(user?.telephone ?? '')
  const [poids,      setPoids]      = useState(user?.poids?.toString() ?? '')
  const [taille,     setTaille]     = useState(user?.taille?.toString() ?? '')
  const [objectif,   setObjectif]   = useState(user?.objectif ?? '')
  const [newWeight,  setNewWeight]  = useState('')

  // Weight history — stored as JSON in SecureStore via API
  const { data: weightHistory = [], refetch: refetchWeight } = useQuery({
    queryKey: ['weight-history'],
    queryFn: () => api.get('/users/me/weight-history').then(r => r.data).catch(() => []),
  })

  const updateMut = useMutation({
    mutationFn: (body: any) => api.put('/users/me', body).then(r => r.data),
    onSuccess: () => { loadUser(); setShowEdit(false); Alert.alert('✅ Profil mis à jour !') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Mise à jour impossible'),
  })

  const addWeightMut = useMutation({
    mutationFn: (w: number) => api.post('/users/me/weight', { weight: w, date: format(new Date(), 'yyyy-MM-dd') }),
    onSuccess: () => {
      refetchWeight()
      loadUser()
      setNewWeight('')
      setShowWeight(false)
      Alert.alert('✅ Poids enregistré !')
    },
    onError: () => Alert.alert('Erreur', 'Impossible d\'enregistrer le poids'),
  })

  const uploadPhotoMut = useMutation({
    mutationFn: async (uri: string) => {
      const formData = new FormData()
      const filename = uri.split('/').pop() ?? 'photo.jpg'
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
      formData.append('file', { uri, name: filename, type: mime } as any)
      return api.post('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => { loadUser(); Alert.alert('✅ Photo mise à jour !') },
    onError: () => Alert.alert('Erreur', 'Impossible d\'uploader la photo'),
  })

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      uploadPhotoMut.mutate(result.assets[0].uri)
    }
  }

  const handleLogout = () =>
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ])

  if (!user) return null

  const bmi = user.poids && user.taille
    ? (user.poids / ((user.taille / 100) ** 2)).toFixed(1)
    : null

  const bmiColor = bmi
    ? parseFloat(bmi) < 18.5 ? Colors.warning
    : parseFloat(bmi) < 25   ? Colors.success
    : parseFloat(bmi) < 30   ? Colors.warning
    : Colors.error
    : Colors.textMuted

  // Simple inline weight chart
  const chartData = Array.isArray(weightHistory) ? weightHistory.slice(-14) : []
  const maxW = chartData.length ? Math.max(...chartData.map((d: any) => d.weight)) + 2 : 100
  const minW = chartData.length ? Math.min(...chartData.map((d: any) => d.weight)) - 2 : 50
  const CHART_H = 80
  const CHART_W = width - 72

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <TopNav title="Mon profil" subtitle="MEMBRE" onMenuPress={open} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Avatar + photo ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.8}>
            {user.photo_url ? (
              <Image source={{ uri: user.photo_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user.nom?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user.nom}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {uploadPhotoMut.isPending && (
            <Text style={styles.uploadingTxt}>Envoi en cours...</Text>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{user.poids ?? '—'}</Text>
            <Text style={styles.statLbl}>kg</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{user.taille ?? '—'}</Text>
            <Text style={styles.statLbl}>cm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, bmi ? { color: bmiColor } : {}]}>{bmi ?? '—'}</Text>
            <Text style={styles.statLbl}>IMC</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal} numberOfLines={1}>{user.objectif ? user.objectif.split(' ')[0] : '—'}</Text>
            <Text style={styles.statLbl}>Objectif</Text>
          </View>
        </View>

        {/* ── Absences ── */}
        <Card style={styles.absCard} elevated>
          <View style={styles.absRow}>
            <Text style={styles.absLabel}>Absences non justifiées</Text>
            <Text style={[styles.absCount, { color: user.no_show_count >= 3 ? Colors.error : Colors.textPrimary }]}>
              {user.no_show_count ?? 0} / 3
            </Text>
          </View>
          <View style={styles.absTrack}>
            {[0,1,2].map(i => (
              <View key={i} style={[styles.absBar, {
                backgroundColor: i < (user.no_show_count ?? 0) ? Colors.error : Colors.border,
              }]} />
            ))}
          </View>
          {user.is_flagged && (
            <Text style={styles.flaggedTxt}>⚠️ Compte signalé — contactez l'accueil</Text>
          )}
        </Card>

        {/* ── Weight chart ── */}
        <Card style={styles.weightCard} elevated>
          <View style={styles.weightHeader}>
            <Text style={styles.weightTitle}>Suivi du poids</Text>
            <TouchableOpacity style={styles.addWeightBtn} onPress={() => setShowWeight(true)}>
              <Text style={styles.addWeightTxt}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>

          {chartData.length < 2 ? (
            <View style={styles.noChart}>
              <Text style={styles.noChartTxt}>
                {chartData.length === 0
                  ? 'Aucune donnée — appuyez sur "+ Ajouter" pour commencer'
                  : 'Ajoutez au moins 2 mesures pour voir le graphique'}
              </Text>
            </View>
          ) : (
            <View style={styles.chart}>
              {/* Y-axis labels */}
              <View style={styles.chartYAxis}>
                {[maxW, (maxW+minW)/2, minW].map((v, i) => (
                  <Text key={i} style={styles.chartYLbl}>{Math.round(v)}</Text>
                ))}
              </View>
              {/* Bars */}
              <View style={styles.chartBars}>
                {chartData.map((d: any, i: number) => {
                  const h = Math.max(4, ((d.weight - minW) / (maxW - minW)) * CHART_H)
                  const isLatest = i === chartData.length - 1
                  return (
                    <View key={i} style={styles.chartBarWrap}>
                      <View style={[styles.chartBar, {
                        height: h,
                        backgroundColor: isLatest ? Colors.blue : Colors.blue + '60',
                      }]} />
                      {i % 3 === 0 && (
                        <Text style={styles.chartXLbl}>{d.date?.slice(5)}</Text>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {chartData.length > 0 && (
            <Text style={styles.latestWeight}>
              Dernier : <Text style={{ color: Colors.blue, fontWeight: '700' }}>
                {chartData[chartData.length - 1]?.weight} kg
              </Text>
              {' '}· {chartData[chartData.length - 1]?.date}
            </Text>
          )}
        </Card>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <Button title="✏️ Modifier le profil" onPress={() => {
            setNom(user.nom ?? '')
            setTel(user.telephone ?? '')
            setPoids(user.poids?.toString() ?? '')
            setTaille(user.taille?.toString() ?? '')
            setObjectif(user.objectif ?? '')
            setShowEdit(true)
          }} variant="secondary" style={{ marginBottom: 10 }} />
          <Button title="Se déconnecter" onPress={handleLogout} variant="danger" />
        </View>
      </ScrollView>

      {/* ── Edit modal ── */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowEdit(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Modifier le profil</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Input label="Nom" value={nom} onChangeText={setNom} autoCapitalize="words" style={styles.field} />
              <Input label="Téléphone" value={telephone} onChangeText={setTel} keyboardType="phone-pad" style={styles.field} />
              <View style={styles.row}>
                <Input label="Poids (kg)" value={poids} onChangeText={setPoids} keyboardType="decimal-pad" style={[styles.field, { flex: 1 }]} />
                <View style={{ width: 12 }} />
                <Input label="Taille (cm)" value={taille} onChangeText={setTaille} keyboardType="number-pad" style={[styles.field, { flex: 1 }]} />
              </View>
              <Text style={styles.fieldLabel}>Objectif</Text>
              <View style={styles.chips}>
                {OBJECTIFS.map(obj => (
                  <TouchableOpacity key={obj}
                    style={[styles.chip, objectif === obj && styles.chipActive]}
                    onPress={() => setObjectif(obj)}>
                    <Text style={[styles.chipTxt, objectif === obj && styles.chipTxtActive]}>{obj}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.sheetActions, { marginTop: 16 }]}>
                <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setShowEdit(false)} />
                <Button title="Enregistrer" style={{ flex: 1 }} loading={updateMut.isPending}
                  onPress={() => updateMut.mutate({ nom, telephone, poids: poids ? parseFloat(poids) : null, taille: taille ? parseFloat(taille) : null, objectif: objectif || null })} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Add weight modal ── */}
      <Modal visible={showWeight} animationType="slide" transparent onRequestClose={() => setShowWeight(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowWeight(false)} />
          <View style={[styles.sheet, { maxHeight: '40%' }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Ajouter mon poids</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowWeight(false)}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.weightDate}>{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</Text>
            <Input
              label="Poids (kg)"
              placeholder={user.poids ? `Précédent: ${user.poids} kg` : 'ex: 72.5'}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="decimal-pad"
              style={styles.field}
            />
            <View style={styles.sheetActions}>
              <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setShowWeight(false)} />
              <Button title="Enregistrer" style={{ flex: 1 }} loading={addWeightMut.isPending}
                onPress={() => {
                  const w = parseFloat(newWeight)
                  if (!w || w < 20 || w > 300) return Alert.alert('Valeur invalide', 'Entrez un poids entre 20 et 300 kg')
                  addWeightMut.mutate(w)
                }} />
            </View>
          </View>
        </View>
      </Modal>

      <MemberDrawer visible={visible} onClose={close} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  avatarSection:    { alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  avatarWrap:       { position: 'relative', marginBottom: 12 },
  avatarImg:        { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: Colors.blue },
  avatarPlaceholder:{ width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.blueDim, borderWidth: 2, borderColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:    { color: Colors.blue, fontSize: 36, fontWeight: '900' },
  cameraOverlay:    { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  cameraIcon:       { fontSize: 14 },
  userName:         { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  userEmail:        { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  uploadingTxt:     { color: Colors.blue, fontSize: 12, marginTop: 4 },
  statsRow:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 12 },
  statBox:          { flex: 1, alignItems: 'center' },
  statVal:          { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  statLbl:          { color: Colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },
  statDivider:      { width: 1, height: 36, backgroundColor: Colors.border },
  absCard:          { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  absRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  absLabel:         { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  absCount:         { fontSize: 14, fontWeight: '700' },
  absTrack:         { flexDirection: 'row', gap: 6 },
  absBar:           { flex: 1, height: 6, borderRadius: 3 },
  flaggedTxt:       { color: Colors.warning, fontSize: 12, fontWeight: '600' },
  weightCard:       { marginHorizontal: 16, marginBottom: 12 },
  weightHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  weightTitle:      { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  addWeightBtn:     { backgroundColor: Colors.blue + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.blue + '60' },
  addWeightTxt:     { color: Colors.blue, fontSize: 12, fontWeight: '700' },
  noChart:          { paddingVertical: 20, alignItems: 'center' },
  noChartTxt:       { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  chart:            { flexDirection: 'row', gap: 4, height: 100 },
  chartYAxis:       { justifyContent: 'space-between', paddingVertical: 2, width: 28 },
  chartYLbl:        { color: Colors.textMuted, fontSize: 9, textAlign: 'right' },
  chartBars:        { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  chartBarWrap:     { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar:         { width: '100%', borderRadius: 3, minHeight: 4 },
  chartXLbl:        { color: Colors.textMuted, fontSize: 8, marginTop: 2 },
  latestWeight:     { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
  actions:          { marginHorizontal: 16, marginTop: 8 },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:            { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '92%', borderTopWidth: 1, borderColor: Colors.border },
  handle:           { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle:       { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  closeBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  closeTxt:         { color: Colors.textSecondary, fontSize: 15 },
  field:            { marginBottom: 14 },
  row:              { flexDirection: 'row' },
  fieldLabel:       { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chips:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip:             { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  chipActive:       { backgroundColor: Colors.blueDim, borderColor: Colors.blue },
  chipTxt:          { color: Colors.textSecondary, fontSize: 12 },
  chipTxtActive:    { color: Colors.blue, fontWeight: '700' },
  sheetActions:     { flexDirection: 'row', gap: 12 },
  weightDate:       { color: Colors.textMuted, fontSize: 12, marginBottom: 12 },
})