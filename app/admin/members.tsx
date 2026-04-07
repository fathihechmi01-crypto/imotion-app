import { TopNav } from '@/components/ui/TopNav'
import { AdminDrawer, useAdminDrawer } from '@/components/ui/AdminDrawer'
import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'

interface Member {
  id: number; nom: string; email: string; telephone?: string
  is_admin: number; no_show_count: number; is_flagged: boolean
}

const SUB_TYPES = ['basic', 'premium', 'vip']
const SUB_ICONS: Record<string, string> = { basic: '⚡', premium: '🌟', vip: '👑' }

export default function AdminMembersScreen() {
  const { visible, open, close } = useAdminDrawer()
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [showSub, setShowSub]   = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selected, setSelected] = useState<Member | null>(null)

  // Create form
  const [nom, setNom]     = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [tel, setTel]     = useState('')

  // Edit form
  const [editNom, setEditNom] = useState('')
  const [editTel, setEditTel] = useState('')

  // Subscription form — EMAIL based now
  const [subEmail,    setSubEmail]    = useState('')
  const [subType,     setSubType]     = useState('basic')
  const [dateDebut,   setDateDebut]   = useState('')
  const [dateFin,     setDateFin]     = useState('')
  const [subLoading,  setSubLoading]  = useState(false)

  // ── Queries ─────────────────────────────────────────────────────────
  // FIX: trailing slash on /users/
  const { data: _members, isLoading, refetch } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/users/').then(r => r.data),
  })
  const members: Member[] = (_members as Member[]) ?? []

  // ── Mutations ────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (body: any) => api.post('/auth/register', body).then(r => r.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['members'] })
      setShowAdd(false)
      resetCreate()
      Alert.alert('✅ Membre créé !', `${data.nom} — ${data.email}`)
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Création impossible'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => api.put(`/users/${id}`, body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setShowEdit(false); Alert.alert('✅ Mis à jour !') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Mise à jour impossible'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); Alert.alert('✅ Supprimé') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Suppression impossible'),
  })

  const unflagMut = useMutation({
    mutationFn: (id: number) => api.patch(`/users/${id}/unflag`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); Alert.alert('✅ Réhabilité') },
  })

  // ── Helpers ───────────────────────────────────────────────────────────
  const resetCreate = () => { setNom(''); setEmail(''); setPass(''); setTel('') }
  const resetSub    = () => { setSubEmail(''); setSubType('basic'); setDateDebut(''); setDateFin('') }

  const openEdit = (m: Member) => {
    setSelected(m); setEditNom(m.nom); setEditTel(m.telephone ?? ''); setShowEdit(true)
  }

  const openSub = (m: Member) => {
    setSelected(m); setSubEmail(m.email); setShowSub(true)
  }

  // Email-based subscription: look up user by email first
  const handleCreateSub = async () => {
    if (!subEmail || !dateDebut || !dateFin) {
      return Alert.alert('Requis', 'Email et dates sont obligatoires. Format: YYYY-MM-DD')
    }
    setSubLoading(true)
    try {
      // Find user by listing and filtering by email
      const usersRes = await api.get('/users/')
      const users: Member[] = usersRes.data
      const found = users.find(u => u.email.toLowerCase() === subEmail.toLowerCase().trim())
      if (!found) {
        Alert.alert('Introuvable', `Aucun membre avec l'email: ${subEmail}`)
        setSubLoading(false)
        return
      }
      await api.post('/abonnements/', {
        utilisateur_id: found.id,
        type: subType,
        date_debut: dateDebut,
        date_fin: dateFin,
      })
      qc.invalidateQueries({ queryKey: ['members'] })
      setShowSub(false)
      resetSub()
      Alert.alert('✅ Abonnement créé !', `${subType.toUpperCase()} pour ${found.nom}`)
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail ?? 'Erreur création abonnement')
    } finally {
      setSubLoading(false)
    }
  }

  const confirmDelete = (m: Member) =>
    Alert.alert(`Supprimer ${m.nom} ?`, 'Toutes ses réservations seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMut.mutate(m.id) },
    ])

  const filtered  = members.filter(m =>
    m.nom.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )
  const flagged = filtered.filter(m => m.is_flagged)
  const normal  = filtered.filter(m => !m.is_flagged)

  const renderMember = ({ item: m }: { item: Member }) => (
    <Card style={[styles.card, m.is_flagged && { borderColor: Colors.warning + '50' }]} elevated>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, {
          backgroundColor: m.is_flagged ? Colors.warning + '22' : Colors.blueDim,
          borderColor: m.is_flagged ? Colors.warning : Colors.blue,
        }]}>
          <Text style={[styles.avatarTxt, { color: m.is_flagged ? Colors.warning : Colors.blue }]}>
            {m.nom.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.name}>{m.nom}</Text>
            {m.is_admin === 1 && (
              <View style={styles.adminBadge}><Text style={styles.adminBadgeTxt}>ADMIN</Text></View>
            )}
          </View>
          <Text style={styles.emailTxt}>{m.email}</Text>
          {m.telephone ? <Text style={styles.phone}>{m.telephone}</Text> : null}
        </View>
      </View>

      {m.is_flagged && (
        <View style={styles.flagRow}>
          <Text style={styles.flagTxt}>
            ⚠️ {m.no_show_count} absence{m.no_show_count > 1 ? 's' : ''} non justifiée{m.no_show_count > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.memberActions}>
        <TouchableOpacity style={[styles.aBtn, { borderColor: Colors.blue }]} onPress={() => openEdit(m)}>
          <Text style={[styles.aBtnTxt, { color: Colors.blue }]}>✏️ Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.aBtn, { borderColor: Colors.gold }]} onPress={() => openSub(m)}>
          <Text style={[styles.aBtnTxt, { color: Colors.gold }]}>💳 Abonnement</Text>
        </TouchableOpacity>
        {m.is_flagged && (
          <TouchableOpacity style={[styles.aBtn, { borderColor: Colors.success }]} onPress={() => unflagMut.mutate(m.id)}>
            <Text style={[styles.aBtnTxt, { color: Colors.success }]}>✓ Réhabiliter</Text>
          </TouchableOpacity>
        )}
        {m.is_admin !== 1 && (
          <TouchableOpacity style={[styles.aBtn, { borderColor: Colors.error + '60' }]} onPress={() => confirmDelete(m)}>
            <Text style={[styles.aBtnTxt, { color: Colors.error }]}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <TopNav title="Membres" subtitle="ADMIN" onMenuPress={open} />
      <View style={styles.header}>
        <View>
          
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetCreate(); setShowAdd(true) }}>
          <Text style={styles.addBtnTxt}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: Colors.textMuted, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList<Member>
        data={[...flagged, ...normal]}
        keyExtractor={m => m.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        ListHeaderComponent={flagged.length > 0 ? (
          <Text style={styles.sectionLabel}>⚠️ SIGNALÉS ({flagged.length})</Text>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>
              {search ? 'Aucun résultat.' : 'Aucun membre.\nAppuyez sur "+ Ajouter".'}
            </Text>
          </View>
        }
        renderItem={renderMember}
      />

      {/* ── Create Member Sheet ── */}
      <Sheet visible={showAdd} onClose={() => setShowAdd(false)} title="Nouveau Membre">
        <Input label="Nom *" placeholder="Prénom Nom" value={nom} onChangeText={setNom} autoCapitalize="words" style={styles.field} />
        <Input label="Email *" placeholder="email@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.field} />
        <Input label="Mot de passe *" placeholder="Min. 8 caractères" value={pass} onChangeText={setPass} secureTextEntry style={styles.field} />
        <Input label="Téléphone" placeholder="+216 XX XXX XXX" value={tel} onChangeText={setTel} keyboardType="phone-pad" style={styles.field} />
        <View style={styles.sheetActions}>
          <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => { setShowAdd(false); resetCreate() }} />
          <Button title="Créer" loading={createMut.isPending} style={{ flex: 1 }}
            onPress={() => {
              if (!nom || !email || !pass) return Alert.alert('Requis', 'Nom, email et mot de passe sont obligatoires.')
              createMut.mutate({ nom, email, mot_de_passe: pass, telephone: tel, is_admin: 0 })
            }} />
        </View>
      </Sheet>

      {/* ── Edit Member Sheet ── */}
      <Sheet visible={showEdit} onClose={() => setShowEdit(false)} title={`Modifier ${selected?.nom ?? ''}`}>
        <Input label="Nom" value={editNom} onChangeText={setEditNom} autoCapitalize="words" style={styles.field} />
        <Input label="Téléphone" value={editTel} onChangeText={setEditTel} keyboardType="phone-pad" style={styles.field} />
        <View style={styles.sheetActions}>
          <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setShowEdit(false)} />
          <Button title="Enregistrer" loading={updateMut.isPending} style={{ flex: 1 }}
            onPress={() => {
              if (!selected) return
              updateMut.mutate({ id: selected.id, body: { nom: editNom, telephone: editTel } })
            }} />
        </View>
      </Sheet>

      {/* ── Subscription Sheet — email based ── */}
      <Sheet visible={showSub} onClose={() => setShowSub(false)} title="Créer un abonnement">
        <Input
          label="Email du membre *"
          placeholder="membre@exemple.com"
          value={subEmail}
          onChangeText={setSubEmail}
          keyboardType="email-address"
          style={styles.field}
        />
        <Text style={styles.fieldLabel}>Type *</Text>
        <View style={styles.subPicker}>
          {SUB_TYPES.map(t => (
            <TouchableOpacity key={t}
              style={[styles.subChip, subType === t && styles.subChipActive]}
              onPress={() => setSubType(t)}>
              <Text style={[styles.subChipTxt, subType === t && styles.subChipTxtActive]}>
                {SUB_ICONS[t]} {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="Date début *" placeholder="2025-01-01" value={dateDebut} onChangeText={setDateDebut} style={styles.field} />
        <Input label="Date fin *"   placeholder="2025-12-31" value={dateFin}   onChangeText={setDateFin}   style={styles.field} />
        <View style={styles.sheetActions}>
          <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => { setShowSub(false); resetSub() }} />
          <Button title="Créer" variant="gold" loading={subLoading} style={{ flex: 1 }} onPress={handleCreateSub} />
        </View>
      </Sheet>
      <AdminDrawer visible={visible} onClose={close} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  adminLabel:      { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title:           { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  count:           { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  addBtn:          { backgroundColor: Colors.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  addBtnTxt:       { color: '#fff', fontWeight: '800', fontSize: 14 },
  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  searchInput:     { flex: 1, height: 46, color: Colors.textPrimary, fontSize: 15 },
  list:            { paddingHorizontal: 20, paddingBottom: 24 },
  sectionLabel:    { color: Colors.warning, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  card:            { marginBottom: 10, gap: 10 },
  cardRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:          { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarTxt:       { fontWeight: '900', fontSize: 20 },
  name:            { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  emailTxt:        { color: Colors.textSecondary, fontSize: 12 },
  phone:           { color: Colors.textMuted, fontSize: 12 },
  adminBadge:      { backgroundColor: Colors.gold + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.gold },
  adminBadgeTxt:   { color: Colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  flagRow:         { backgroundColor: Colors.warning + '15', borderRadius: 8, padding: 8 },
  flagTxt:         { color: Colors.warning, fontSize: 12, fontWeight: '600' },
  memberActions:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  aBtn:            { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  aBtnTxt:         { fontSize: 12, fontWeight: '700' },
  empty:           { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:       { fontSize: 48 },
  emptyText:       { color: Colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  field:           { marginBottom: 16 },
  fieldLabel:      { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  subPicker:       { flexDirection: 'row', gap: 8, marginBottom: 20 },
  subChip:         { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceHigh },
  subChipActive:   { backgroundColor: Colors.goldDim, borderColor: Colors.gold },
  subChipTxt:      { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  subChipTxtActive:{ color: Colors.gold, fontWeight: '800' },
  sheetActions:    { flexDirection: 'row', gap: 12, marginTop: 8 },
})