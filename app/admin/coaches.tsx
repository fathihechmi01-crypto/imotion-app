import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, Modal, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachesService, type Coach } from '@/services/coaches.service'
import { Colors, SportColors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const SPORTS = ['EMS', 'Cardio', 'Musculation']

export default function AdminCoachesScreen() {
  const qc = useQueryClient()

  const { data: _coaches, isLoading, refetch } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => coachesService.getAll(),
  })
  const coaches: Coach[] = (_coaches as Coach[]) ?? []

  const [showAdd,  setShowAdd]  = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selected, setSelected] = useState<Coach | null>(null)

  const [nom,       setNom]   = useState('')
  const [telephone, setTel]   = useState('')
  const [bio,       setBio]   = useState('')
  const [specialite,setSport] = useState('EMS')

  const resetForm = () => { setNom(''); setTel(''); setBio(''); setSport('EMS') }

  const openEdit = (c: Coach) => {
    setSelected(c)
    setNom(c.nom)
    setTel(c.telephone ?? '')
    setBio(c.bio ?? '')
    setSport(c.specialite)
    setShowEdit(true)
  }

  const createMut = useMutation({
    mutationFn: (body: any) => coachesService.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaches'] }); setShowAdd(false); resetForm(); Alert.alert('✅ Coach créé !') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Création impossible'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => coachesService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaches'] }); setShowEdit(false); Alert.alert('✅ Mis à jour !') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Mise à jour impossible'),
  })
  const holidayMut = useMutation({
    mutationFn: (id: number) => coachesService.toggleHoliday(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }),
  })
  const activeMut = useMutation({
    mutationFn: (id: number) => coachesService.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => coachesService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaches'] }); Alert.alert('✅ Supprimé') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Suppression impossible'),
  })

  const confirmDelete = (c: Coach) =>
    Alert.alert(`Supprimer ${c.nom} ?`, 'Toutes ses séances seront affectées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMut.mutate(c.id) },
    ])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.adminLabel}>ADMIN</Text>
          <Text style={styles.title}>Coaches</Text>
          <Text style={styles.count}>{coaches.length} coach{coaches.length !== 1 ? 'es' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowAdd(true) }}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList<Coach>
        data={coaches}
        keyExtractor={c => c.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏅</Text>
            <Text style={styles.emptyText}>Aucun coach.{'\n'}Appuyez sur "+ Ajouter" pour commencer.</Text>
          </View>
        }
        renderItem={({ item: c }) => {
          const sc = SportColors[c.specialite] ?? Colors.blue
          return (
            <Card style={[styles.card, { borderLeftColor: sc, borderLeftWidth: 3 }]} elevated>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { borderColor: sc }]}>
                  <Text style={[styles.avatarTxt, { color: sc }]}>{c.nom.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachName}>{c.nom}</Text>
                  <View style={[styles.sportTag, { backgroundColor: sc + '22', borderColor: sc }]}>
                    <Text style={[styles.sportTagTxt, { color: sc }]}>{c.specialite}</Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: c.is_active ? Colors.success : Colors.error }]} />
                  {c.is_on_holiday && <Text style={{ fontSize: 14 }}>🌴</Text>}
                </View>
              </View>

              {c.telephone ? <Text style={styles.phone}>📞 {c.telephone}</Text> : null}
              {c.bio ? <Text style={styles.bio} numberOfLines={2}>{c.bio}</Text> : null}

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.blue }]} onPress={() => openEdit(c)}>
                  <Text style={[styles.actionTxt, { color: Colors.blue }]}>✏️ Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: c.is_on_holiday ? Colors.success : Colors.warning }]}
                  onPress={() => holidayMut.mutate(c.id)}>
                  <Text style={[styles.actionTxt, { color: c.is_on_holiday ? Colors.success : Colors.warning }]}>
                    {c.is_on_holiday ? '✓ Congé' : '🌴 Congé'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: c.is_active ? Colors.error : Colors.success }]}
                  onPress={() => activeMut.mutate(c.id)}>
                  <Text style={[styles.actionTxt, { color: c.is_active ? Colors.error : Colors.success }]}>
                    {c.is_active ? 'Désactiver' : '✓ Activer'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.error + '60' }]} onPress={() => confirmDelete(c)}>
                  <Text style={[styles.actionTxt, { color: Colors.error }]}>🗑</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )
        }}
      />

      {/* ── Add Modal ── */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Nouveau Coach</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Input
                label="Nom *"
                placeholder="Prénom Nom"
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
                style={styles.field}
              />
              <Input
                label="Téléphone"
                placeholder="+216 XX XXX XXX"
                value={telephone}
                onChangeText={setTel}
                keyboardType="phone-pad"
                style={styles.field}
              />
              <Input
                label="Bio"
                placeholder="Spécialisation, expérience..."
                value={bio}
                onChangeText={setBio}
                autoCapitalize="sentences"
                style={styles.field}
              />
              <Text style={styles.fieldLabel}>Spécialité *</Text>
              <View style={styles.sportPicker}>
                {SPORTS.map(s => {
                  const c = SportColors[s] ?? Colors.blue
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.sportChip, specialite === s && { backgroundColor: c + '33', borderColor: c }]}
                      onPress={() => setSport(s)}>
                      <Text style={[styles.sportChipText, specialite === s && { color: c, fontWeight: '800' }]}>{s}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <View style={styles.sheetActions}>
                <Button title="Annuler" variant="ghost" style={{ flex: 1 }}
                  onPress={() => { setShowAdd(false); resetForm() }} />
                <Button title="Créer" loading={createMut.isPending} style={{ flex: 1 }}
                  onPress={() => {
                    if (!nom.trim()) return Alert.alert('Requis', 'Le nom est obligatoire.')
                    createMut.mutate({ nom: nom.trim(), telephone: telephone.trim(), bio: bio.trim(), specialite })
                  }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Modifier {selected?.nom}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Input
                label="Nom *"
                placeholder="Prénom Nom"
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
                style={styles.field}
              />
              <Input
                label="Téléphone"
                placeholder="+216 XX XXX XXX"
                value={telephone}
                onChangeText={setTel}
                keyboardType="phone-pad"
                style={styles.field}
              />
              <Input
                label="Bio"
                placeholder="Spécialisation, expérience..."
                value={bio}
                onChangeText={setBio}
                autoCapitalize="sentences"
                style={styles.field}
              />
              <Text style={styles.fieldLabel}>Spécialité *</Text>
              <View style={styles.sportPicker}>
                {SPORTS.map(s => {
                  const c = SportColors[s] ?? Colors.blue
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.sportChip, specialite === s && { backgroundColor: c + '33', borderColor: c }]}
                      onPress={() => setSport(s)}>
                      <Text style={[styles.sportChipText, specialite === s && { color: c, fontWeight: '800' }]}>{s}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <View style={styles.sheetActions}>
                <Button title="Annuler" variant="ghost" style={{ flex: 1 }}
                  onPress={() => { setShowEdit(false); resetForm() }} />
                <Button title="Enregistrer" loading={updateMut.isPending} style={{ flex: 1 }}
                  onPress={() => {
                    if (!selected) return
                    if (!nom.trim()) return Alert.alert('Requis', 'Le nom est obligatoire.')
                    updateMut.mutate({ id: selected.id, body: { nom: nom.trim(), telephone: telephone.trim(), bio: bio.trim(), specialite } })
                  }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  adminLabel:    { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title:         { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  count:         { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  addBtn:        { backgroundColor: Colors.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  addBtnText:    { color: '#fff', fontWeight: '800', fontSize: 14 },
  list:          { paddingHorizontal: 20, paddingBottom: 24 },
  empty:         { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:     { fontSize: 48 },
  emptyText:     { color: Colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card:          { marginBottom: 12, gap: 10 },
  cardTop:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.blueDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarTxt:     { fontWeight: '900', fontSize: 20 },
  coachName:     { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sportTag:      { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  sportTagTxt:   { fontSize: 11, fontWeight: '700' },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:     { width: 8, height: 8, borderRadius: 4 },
  phone:         { color: Colors.textSecondary, fontSize: 13 },
  bio:           { color: Colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  actions:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionTxt:     { fontSize: 12, fontWeight: '700' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%', borderTopWidth: 1, borderColor: Colors.border },
  handle:        { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:    { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  field:         { marginBottom: 16 },
  fieldLabel:    { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  sportPicker:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  sportChip:     { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceHigh },
  sportChipText: { color: Colors.textSecondary, fontSize: 13 },
  sheetActions:  { flexDirection: 'row', gap: 12 },
})