import { useState } from 'react'
import { TopNav } from '@/components/ui/TopNav'
import { AdminDrawer, useAdminDrawer } from '@/components/ui/AdminDrawer'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, Modal, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { abonnementsService, type Abonnement, type AbonnementExpiring } from '@/services/abonnements.service'
import { paiementsService, type Paiement, type PaySum } from '@/services/paiements.service'
import { Colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const SUB_TYPES  = ['basic', 'premium', 'vip']
const TIER_COLOR = { basic: Colors.silver, premium: Colors.blue, vip: Colors.gold } as Record<string,string>
const TIER_ICON  = { basic: '⚡', premium: '🌟', vip: '👑' } as Record<string,string>
type Tab = 'actifs' | 'expiring' | 'paiements'

export default function AdminAbonnementsScreen() {
  const qc = useQueryClient()
  const [tab, setTab]           = useState<Tab>('actifs')
  const [showAdd, setShowAdd]   = useState(false)
  const [showPay, setShowPay]   = useState(false)
  const [subEmail, setSubEmail] = useState('')
  const [subLookupLoading, setSubLookupLoading] = useState(false)
  const { visible, open, close } = useAdminDrawer()
  const [subType, setSubType]   = useState('basic')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin]   = useState('')
  const [payUserId, setPayUserId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payDesc, setPayDesc]   = useState('')
  const [userId, setUserId]     = useState('')

  const { data: _abonnements, isLoading: loadAbo, refetch: refAbo } = useQuery({
    queryKey: ['abonnements'],
    queryFn: () => abonnementsService.getAll(),
  })
  const abonnements: Abonnement[] = (_abonnements as Abonnement[]) ?? []

  const { data: _expiring, isLoading: loadExp, refetch: refExp } = useQuery({
    queryKey: ['abonnements-expiring'],
    queryFn: () => abonnementsService.expiringSoon(14),
  })
  const expiring: AbonnementExpiring[] = (_expiring as AbonnementExpiring[]) ?? []

  const { data: _paiements, isLoading: loadPay, refetch: refPay } = useQuery({
    queryKey: ['paiements'],
    queryFn: () => paiementsService.getAll(),
  })
  const paiements: Paiement[] = (_paiements as Paiement[]) ?? []

  const { data: _paySum } = useQuery({
    queryKey: ['paiements-summary'],
    queryFn: () => paiementsService.summary(),
  })
  const paySum: PaySum[] = (_paySum as PaySum[]) ?? []

  const createSubMut = useMutation({
    mutationFn: abonnementsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['abonnements'] }); setShowAdd(false); setSubEmail(''); resetSub(); Alert.alert('✅ Abonnement créé !') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Erreur'),
  })
  const markPaidMut = useMutation({
    mutationFn: (id: number) => abonnementsService.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['abonnements'] }),
  })
  const deleteSubMut = useMutation({
    mutationFn: (id: number) => abonnementsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['abonnements'] }); Alert.alert('✅ Supprimé') },
  })
  const createPayMut = useMutation({
    mutationFn: paiementsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paiements'] }); qc.invalidateQueries({ queryKey: ['paiements-summary'] }); setShowPay(false); resetPay(); Alert.alert('✅ Paiement enregistré') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail),
  })
  const updateStatutMut = useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: string }) => paiementsService.updateStatut(id, statut),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paiements'] }); qc.invalidateQueries({ queryKey: ['paiements-summary'] }) },
  })

  const resetSub = () => { setUserId(''); setSubType('basic'); setDateDebut(''); setDateFin('') }
  const resetPay = () => { setPayUserId(''); setPayAmount(''); setPayDesc('') }

  const confirmDeleteSub = (id: number) =>
    Alert.alert('Supprimer ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteSubMut.mutate(id) },
    ])

  const renderAbonnement = ({ item: a }: { item: Abonnement }) => {
    const color   = TIER_COLOR[a.type] ?? Colors.blue
    const icon    = TIER_ICON[a.type] ?? '⚡'
    const expired = new Date(a.date_fin) < new Date()
    return (
      <Card style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]} elevated>
        <View style={styles.cardRow}>
          <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{icon} {a.type.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: a.is_paid ? Colors.success + '22' : Colors.warning + '22', borderColor: a.is_paid ? Colors.success : Colors.warning }]}>
            <Text style={[styles.badgeText, { color: a.is_paid ? Colors.success : Colors.warning }]}>
              {a.is_paid ? '● Payé' : '● En attente'}
            </Text>
          </View>
        </View>
        <Text style={styles.subUser}>ID: {a.utilisateur_id}</Text>
        <Text style={[styles.subDates, expired && { color: Colors.error }]}>{a.date_debut} → {a.date_fin}{expired ? ' (Expiré)' : ''}</Text>
        <View style={styles.cardActions}>
          {!a.is_paid && (
            <TouchableOpacity style={[styles.smallBtn, { borderColor: Colors.success }]} onPress={() => markPaidMut.mutate(a.id)}>
              <Text style={[styles.smallBtnTxt, { color: Colors.success }]}>✓ Marquer payé</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.smallBtn, { borderColor: Colors.error + '60' }]} onPress={() => confirmDeleteSub(a.id)}>
            <Text style={[styles.smallBtnTxt, { color: Colors.error }]}>🗑</Text>
          </TouchableOpacity>
        </View>
      </Card>
    )
  }

  const renderExpiring = ({ item: e }: { item: AbonnementExpiring }) => (
    <Card style={[styles.card, { borderLeftColor: Colors.warning, borderLeftWidth: 3 }]} elevated>
      <View style={styles.cardRow}>
        <Text style={styles.subUser}>{e.nom}</Text>
        <View style={[styles.badge, { backgroundColor: Colors.warning + '22', borderColor: Colors.warning }]}>
          <Text style={[styles.badgeText, { color: Colors.warning }]}>{e.days_left}j restants</Text>
        </View>
      </View>
      <Text style={styles.subDates}>{e.email}</Text>
      <Text style={styles.subDates}>{e.type.toUpperCase()} · expire le {e.date_fin}</Text>
    </Card>
  )

  const renderPaiement = ({ item: p }: { item: Paiement }) => {
    const sc = p.statut === 'paid' ? Colors.success : p.statut === 'failed' ? Colors.error : p.statut === 'refunded' ? Colors.warning : Colors.textMuted
    return (
      <Card style={styles.card} elevated>
        <View style={styles.cardRow}>
          <Text style={styles.payAmount}>{p.montant.toFixed(2)} €</Text>
          <View style={[styles.badge, { backgroundColor: sc + '22', borderColor: sc }]}>
            <Text style={[styles.badgeText, { color: sc }]}>{p.statut}</Text>
          </View>
        </View>
        <Text style={styles.subUser}>Membre #{p.utilisateur_id}</Text>
        {p.description ? <Text style={styles.subDates}>{p.description}</Text> : null}
        <Text style={styles.subDates}>{p.created_at?.slice(0, 10)}</Text>
        {p.statut === 'pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.smallBtn, { borderColor: Colors.success }]} onPress={() => updateStatutMut.mutate({ id: p.id, statut: 'paid' })}>
              <Text style={[styles.smallBtnTxt, { color: Colors.success }]}>✓ Payé</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, { borderColor: Colors.error }]} onPress={() => updateStatutMut.mutate({ id: p.id, statut: 'failed' })}>
              <Text style={[styles.smallBtnTxt, { color: Colors.error }]}>✗ Échoué</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <TopNav title="Abonnements" subtitle="ADMIN" onMenuPress={open} />
      <View style={styles.header}>
        <View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.blue }]} onPress={() => setShowPay(true)}>
            <Text style={[styles.addBtnText, { color: Colors.blue }]}>+ Paiement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addBtnText}>+ Abo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Revenue summary */}
      {paySum.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
          {paySum.map((s) => (
            <View key={s.statut} style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{s.total_eur} €</Text>
              <Text style={styles.summaryLabel}>{s.statut} ({s.count})</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['actifs', 'expiring', 'paiements'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'actifs' ? `Abos (${abonnements.length})` : t === 'expiring' ? `⚠️ (${expiring.length})` : `Paiements (${paiements.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'actifs' && (
        <FlatList<Abonnement> data={abonnements} keyExtractor={a => a.id.toString()} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loadAbo} onRefresh={refAbo} tintColor={Colors.blue} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Aucun abonnement</Text></View>}
          renderItem={renderAbonnement} />
      )}
      {tab === 'expiring' && (
        <FlatList<AbonnementExpiring> data={expiring} keyExtractor={(_, i) => i.toString()} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loadExp} onRefresh={refExp} tintColor={Colors.blue} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Aucun abonnement expirant bientôt</Text></View>}
          renderItem={renderExpiring} />
      )}
      {tab === 'paiements' && (
        <FlatList<Paiement> data={paiements} keyExtractor={p => p.id.toString()} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loadPay} onRefresh={refPay} tintColor={Colors.blue} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Aucun paiement</Text></View>}
          renderItem={renderPaiement} />
      )}

      {/* Create Abonnement Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Nouvel Abonnement</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Email du membre *" placeholder="membre@exemple.com" value={subEmail} onChangeText={setSubEmail} keyboardType="email-address" autoCapitalize="none" style={styles.field} />
              <Text style={styles.fieldLabel}>Type *</Text>
              <View style={styles.typePicker}>
                {SUB_TYPES.map(t => {
                  const c = TIER_COLOR[t]
                  return (
                    <TouchableOpacity key={t} style={[styles.typeChip, subType === t && { backgroundColor: c + '22', borderColor: c }]} onPress={() => setSubType(t)}>
                      <Text style={[styles.typeChipText, subType === t && { color: c, fontWeight: '800' }]}>{TIER_ICON[t]} {t}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <Input label="Date début *" placeholder="2025-01-01" value={dateDebut} onChangeText={setDateDebut} style={styles.field} />
              <Input label="Date fin *"   placeholder="2025-12-31" value={dateFin}   onChangeText={setDateFin}   style={styles.field} />
              <View style={styles.sheetActions}>
                <Button title="Annuler" onPress={() => { setShowAdd(false); resetSub() }} variant="ghost" style={{ flex: 1 }} />
                <Button title="Créer" loading={createSubMut.isPending || subLookupLoading} variant="gold"
                  onPress={() => {
                    if (!userId || !dateDebut || !dateFin) return Alert.alert('Requis', 'Tous les champs sont obligatoires')
                    if (!subEmail || !dateDebut || !dateFin) return Alert.alert('Requis', 'Email et dates obligatoires. Format: YYYY-MM-DD')
                    setSubLookupLoading(true)
                    api.get('/users/').then(r => {
                      const found = (r.data as any[]).find(u => u.email.toLowerCase() === subEmail.toLowerCase().trim())
                      if (!found) { setSubLookupLoading(false); return Alert.alert('Introuvable', `Aucun membre avec l\'email: ${subEmail}`) }
                      createSubMut.mutate({ utilisateur_id: found.id, type: subType, date_debut: dateDebut, date_fin: dateFin })
                      setSubLookupLoading(false)
                    }).catch(() => { setSubLookupLoading(false); Alert.alert('Erreur', 'Impossible de chercher le membre.') })
                  }} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Payment Modal */}
      <Modal visible={showPay} animationType="slide" transparent onRequestClose={() => setShowPay(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Nouveau Paiement</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="ID Membre *"   placeholder="ex: 3"      value={payUserId} onChangeText={setPayUserId} keyboardType="number-pad"   style={styles.field} />
              <Input label="Montant (€) *" placeholder="ex: 49.90"   value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad"   style={styles.field} />
              <Input label="Description"   placeholder="Abonnement..." value={payDesc} onChangeText={setPayDesc}   autoCapitalize="sentences" style={styles.field} />
              <View style={styles.sheetActions}>
                <Button title="Annuler" onPress={() => { setShowPay(false); resetPay() }} variant="ghost" style={{ flex: 1 }} />
                <Button title="Enregistrer" loading={createPayMut.isPending}
                  onPress={() => {
                    if (!payUserId || !payAmount) return Alert.alert('Requis', 'ID membre et montant obligatoires')
                    createPayMut.mutate({ utilisateur_id: parseInt(payUserId), montant: parseFloat(payAmount), description: payDesc })
                  }} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <AdminDrawer visible={visible} onClose={close} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  adminLabel:      { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title:           { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  addBtn:          { backgroundColor: Colors.blue, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginTop: 4 },
  addBtnText:      { color: '#fff', fontWeight: '800', fontSize: 13 },
  summaryRow:      { paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  summaryCard:     { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, minWidth: 120, alignItems: 'center' },
  summaryValue:    { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  summaryLabel:    { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  tabRow:          { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tabBtn:          { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surface },
  tabBtnActive:    { backgroundColor: Colors.blueDim, borderColor: Colors.blue },
  tabBtnText:      { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  tabBtnTextActive:{ color: Colors.blue, fontWeight: '800' },
  list:            { paddingHorizontal: 20, paddingBottom: 24 },
  card:            { marginBottom: 10, gap: 8 },
  cardRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText:       { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  subUser:         { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  subDates:        { color: Colors.textSecondary, fontSize: 12 },
  cardActions:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  smallBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  smallBtnTxt:     { fontSize: 12, fontWeight: '700' },
  payAmount:       { color: Colors.textPrimary, fontSize: 20, fontWeight: '900' },
  empty:           { alignItems: 'center', paddingTop: 60 },
  emptyText:       { color: Colors.textMuted, fontSize: 15 },
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '88%', borderTopWidth: 1, borderColor: Colors.border },
  sheetHandle:     { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  field:           { marginBottom: 16 },
  fieldLabel:      { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  typePicker:      { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeChip:        { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceHigh },
  typeChipText:    { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  sheetActions:    { flexDirection: 'row', gap: 12, marginTop: 8 },
})