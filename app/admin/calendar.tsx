import { TopNav } from '@/components/ui/TopNav'
import { AdminDrawer, useAdminDrawer } from '@/components/ui/AdminDrawer'
import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, Alert, Modal,
  ScrollView, TouchableOpacity, FlatList, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar, DateData } from 'react-native-calendars'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsService } from '@/services/sessions.service'
import api from '@/services/api'
import { Colors, SportColors } from '@/constants/colors'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const SPORTS = ['EMS', 'Cardio', 'Musculation']

interface Session {
  id: number; date: string; heure: string; sport: string
  capacite: number; reservations: number; is_full: boolean
  coach_nom: string | null; coach_id: number | null
  is_solo: boolean; recurrence_group_id?: string
}
interface Reservation { id: number; utilisateur_id: number; created_at: string; checked_in: boolean; no_show: boolean }
interface Coach { id: number; nom: string; specialite: string; is_on_holiday: boolean }

export default function AdminCalendarScreen() {
  const { visible, open, close } = useAdminDrawer()
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(today)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // Add form
  const [sport, setSport] = useState('EMS')
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('')
  const [coachId, setCoachId] = useState('')
  const [capacite, setCapacite] = useState('4')
  const [isSolo, setIsSolo] = useState(false)
  const [recurrence, setRecurrence] = useState('0')

  // Edit form
  const [editDate, setEditDate] = useState('')
  const [editHeure, setEditHeure] = useState('')

  // ── Queries ────────────────────────────────────────────────────────
  const { data: _sessions, isLoading, refetch } = useQuery({
    queryKey: ['sessions-all'],
    queryFn: () => sessionsService.getAll(),
  })
  const sessions: Session[] = (_sessions as Session[]) ?? []

  const { data: _coaches } = useQuery({
    queryKey: ['coaches', sport],
    queryFn: () => api.get('/coaches', { params: { sport } }).then(r => r.data),
  })
  const coaches: Coach[] = (_coaches as Coach[]) ?? []

  const { data: _reservations, isLoading: loadRes } = useQuery({
    queryKey: ['session-reservations', selectedSession?.id],
    queryFn: () => selectedSession
      ? api.get(`/reservations/seance/${selectedSession.id}`).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!selectedSession && showDetail,
  })
  const sessionReservations: Reservation[] = (_reservations as Reservation[]) ?? []

  // ── Mutations ──────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (body: any) => sessionsService.create(body),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['sessions-all'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowAdd(false)
      resetAdd()
      const count = data.created ?? 1
      Alert.alert('✅ Créée !', `${count} séance${count > 1 ? 's' : ''} créée${count > 1 ? 's' : ''}.`)
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Création impossible'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => sessionsService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions-all'] })
      setShowEdit(false)
      setShowDetail(false)
      Alert.alert('✅ Séance reprogrammée !')
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Modification impossible'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => sessionsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions-all'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowDetail(false)
      setSelectedSession(null)
      Alert.alert('✅ Supprimée', 'Les membres ont été notifiés.')
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Suppression impossible'),
  })

  const noShowMut = useMutation({
    mutationFn: (id: number) => api.patch(`/reservations/${id}/no-show`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-reservations', selectedSession?.id] }),
  })

  const checkInMut = useMutation({
    mutationFn: ({ uid, sid }: { uid: number; sid: number }) =>
      api.post('/checkin/manual', null, { params: { utilisateur_id: uid, seance_id: sid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-reservations', selectedSession?.id] }),
  })

  // ── Helpers ────────────────────────────────────────────────────────
  const resetAdd = () => { setDate(''); setHeure(''); setCoachId(''); setCapacite('4'); setIsSolo(false); setRecurrence('0') }

  const openDetail = (s: Session) => { setSelectedSession(s); setShowDetail(true) }

  const openEdit = (s: Session) => {
    setSelectedSession(s)
    setEditDate(s.date)
    setEditHeure(s.heure.slice(0, 5))
    setShowEdit(true)
    setShowDetail(false)
  }

  const confirmDelete = (s: Session) =>
    Alert.alert('Supprimer la séance ?', 'Les membres réservés seront notifiés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMut.mutate(s.id) },
    ])

  // ── Calendar marks ─────────────────────────────────────────────────
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {}
    sessions.forEach(s => {
      const color = SportColors[s.sport] ?? Colors.blue
      if (!marks[s.date]) marks[s.date] = { dots: [], marked: true }
      if (!marks[s.date].dots.some((d: any) => d.color === color))
        marks[s.date].dots.push({ color, selectedDotColor: color })
    })
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: Colors.blueDim,
    }
    return marks
  }, [sessions, selectedDate])

  const sessionsForDay = useMemo(() =>
    sessions.filter(s => s.date === selectedDate).sort((a, b) => a.heure.localeCompare(b.heure)),
    [sessions, selectedDate])

  const dayLabel = useMemo(() => {
    try { return format(new Date(selectedDate + 'T00:00:00'), 'EEEE d MMMM yyyy', { locale: fr }) }
    catch { return selectedDate }
  }, [selectedDate])

  // ── Shared form JSX ────────────────────────────────────────────────
  const SportPicker = () => (
    <>
      <Text style={styles.fieldLabel}>Sport *</Text>
      <View style={styles.chipRow}>
        {SPORTS.map(s => {
          const c = SportColors[s] ?? Colors.blue
          return (
            <TouchableOpacity key={s}
              style={[styles.chip, sport === s && { backgroundColor: c + '33', borderColor: c }]}
              onPress={() => { setSport(s); setCoachId('') }}>
              <Text style={[styles.chipTxt, sport === s && { color: c, fontWeight: '800' }]}>{s}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </>
  )

  const CoachPicker = () => (
    <>
      <Text style={styles.fieldLabel}>
        Coach * — {coaches.length} disponible{coaches.length !== 1 ? 's' : ''} en {sport}
      </Text>
      {coaches.length === 0
        ? <View style={styles.noCoach}><Text style={styles.noCoachTxt}>⚠️ Aucun coach {sport} — ajoutez-en un d'abord.</Text></View>
        : (
          <View style={styles.coachGrid}>
            {coaches.map((c: Coach) => (
              <TouchableOpacity key={c.id}
                style={[styles.coachChip, coachId === String(c.id) && styles.coachChipActive,
                c.is_on_holiday && { opacity: 0.5 }]}
                onPress={() => setCoachId(String(c.id))}
                disabled={c.is_on_holiday}>
                <Text style={[styles.coachChipTxt, coachId === String(c.id) && styles.coachChipTxtActive]}>
                  {c.nom}{c.is_on_holiday ? ' 🌴' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
    </>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      {/* Header */}
      <TopNav title="Seances" subtitle="ADMIN" onMenuPress={open} />
      <View style={styles.header}>
        <View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetAdd(); setDate(selectedDate); setSport('EMS'); setShowAdd(true) }}>
          <Text style={styles.addBtnTxt}>+ Séance</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Calendar */}
        <Calendar
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          theme={{
            backgroundColor: Colors.black,
            calendarBackground: Colors.surface,
            textSectionTitleColor: Colors.textSecondary,
            selectedDayBackgroundColor: Colors.blue,
            selectedDayTextColor: '#fff',
            todayTextColor: Colors.blue,
            dayTextColor: Colors.textPrimary,
            textDisabledColor: Colors.textMuted,
            dotColor: Colors.blue,
            monthTextColor: Colors.textPrimary,
            arrowColor: Colors.blue,
            textMonthFontWeight: '700',
          }}
          style={styles.calendar}
        />

        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(SportColors).map(([s, c]) => (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={styles.legendTxt}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Day header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle} numberOfLines={1}>{dayLabel}</Text>
          <Text style={styles.dayCount}>{sessionsForDay.length} séance{sessionsForDay.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Sessions list */}
        {sessionsForDay.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayTxt}>Aucune séance ce jour.</Text>
            <TouchableOpacity onPress={() => { resetAdd(); setDate(selectedDate); setSport('EMS'); setShowAdd(true) }}>
              <Text style={styles.emptyDayLink}>+ Créer une séance ce jour</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sessionsForDay.map(s => {
            const sc = SportColors[s.sport] ?? Colors.blue
            return (
              <TouchableOpacity key={s.id} style={styles.sessionRow} onPress={() => openDetail(s)} activeOpacity={0.75}>
                <View style={[styles.timeStrip, { backgroundColor: sc }]}>
                  <Text style={styles.timeStripTxt}>{s.heure.slice(0, 5)}</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionSport}>{s.sport}</Text>
                  <Text style={styles.sessionCoach}>{s.coach_nom ?? 'Sans coach'}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={[styles.sessionFill, s.is_full && { color: Colors.error }]}>
                    {s.reservations}/{s.capacite}
                  </Text>
                  {s.is_full && <Text style={styles.fullBadge}>COMPLET</Text>}
                  {s.is_solo && <Text style={styles.soloBadge}>SOLO</Text>}
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* ── Add Session Modal ── */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Nouvelle Séance</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <SportPicker />
              <Input label="Date *" placeholder="2025-06-15" value={date} onChangeText={setDate} style={styles.field} />
              <Input label="Heure *" placeholder="09:00" value={heure} onChangeText={setHeure} style={styles.field} />
              <CoachPicker />
              <View style={{ height: 16 }} />
              <Input label="Capacité" placeholder="4" value={capacite} onChangeText={setCapacite} keyboardType="number-pad" style={styles.field} />

              {/* Solo toggle */}
              <TouchableOpacity style={styles.toggleRow} onPress={() => setIsSolo(!isSolo)}>
                <View style={[styles.toggle, isSolo && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, isSolo && styles.toggleThumbOn]} />
                </View>
                <Text style={styles.toggleLbl}>Séance solo (1 personne max)</Text>
              </TouchableOpacity>

              {/* Recurrence */}
              <Text style={styles.fieldLabel}>Répétition (semaines)</Text>
              <View style={styles.chipRow}>
                {['0', '1', '2', '3', '4'].map(w => (
                  <TouchableOpacity key={w}
                    style={[styles.chip, styles.chipSm, recurrence === w && styles.chipActive]}
                    onPress={() => setRecurrence(w)}>
                    <Text style={[styles.chipTxt, recurrence === w && styles.chipTxtActive]}>
                      {w === '0' ? 'Non' : `${w}×`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {recurrence !== '0' && (
                <Text style={styles.recHint}>
                  → {parseInt(recurrence) + 1} séances créées ({parseInt(recurrence)} semaine{parseInt(recurrence) > 1 ? 's' : ''})
                </Text>
              )}

              <View style={[styles.sheetActions, { marginTop: 20 }]}>
                <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => { setShowAdd(false); resetAdd() }} />
                <Button title="Créer" loading={createMut.isPending} style={{ flex: 1 }}
                  onPress={() => {
                    if (!date || !heure || !coachId) return Alert.alert('Requis', 'Date, heure et coach sont obligatoires.')
                    const d = /^\d{4}-\d{2}-\d{2}$/.test(date)
                    const h = /^\d{2}:\d{2}$/.test(heure)
                    if (!d) return Alert.alert('Format', 'Date: YYYY-MM-DD (ex: 2025-06-15)')
                    if (!h) return Alert.alert('Format', 'Heure: HH:MM (ex: 09:00)')
                    createMut.mutate({
                      date, heure, sport,
                      coach_id: parseInt(coachId),
                      capacite: parseInt(capacite) || 4,
                      is_solo: isSolo,
                      recurrence_weeks: parseInt(recurrence) || 0,
                    })
                  }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Session Detail Modal ── */}
      <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '85%' }]}>
            <View style={styles.handle} />
            {selectedSession && (
              <>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>{selectedSession.sport}</Text>
                    <Text style={styles.detailSub}>
                      {selectedSession.date} · {selectedSession.heure.slice(0, 5)} · {selectedSession.coach_nom ?? 'Sans coach'}
                    </Text>
                  </View>
                  <View style={[styles.fillCircle, {
                    borderColor: selectedSession.is_full ? Colors.error : Colors.success,
                  }]}>
                    <Text style={[styles.fillCircleTxt, { color: selectedSession.is_full ? Colors.error : Colors.success }]}>
                      {selectedSession.reservations}/{selectedSession.capacite}
                    </Text>
                  </View>
                </View>

                {/* Fill bar */}
                <View style={styles.fillBar}>
                  <View style={[styles.fillBarFill, {
                    width: `${selectedSession.capacite > 0 ? Math.round(selectedSession.reservations / selectedSession.capacite * 100) : 0}%` as any,
                    backgroundColor: selectedSession.is_full ? Colors.error : SportColors[selectedSession.sport] ?? Colors.blue,
                  }]} />
                </View>

                {/* Actions */}
                <View style={styles.detailActions}>
                  <TouchableOpacity style={[styles.detailBtn, { borderColor: Colors.blue }]} onPress={() => openEdit(selectedSession)}>
                    <Text style={[styles.detailBtnTxt, { color: Colors.blue }]}>✏️ Reprogrammer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.detailBtn, { borderColor: Colors.error }]} onPress={() => confirmDelete(selectedSession)}>
                    <Text style={[styles.detailBtnTxt, { color: Colors.error }]}>🗑 Supprimer</Text>
                  </TouchableOpacity>
                </View>

                {/* Reservations list */}
                <Text style={styles.resLabel}>RÉSERVATIONS ({sessionReservations.length})</Text>
                {loadRes
                  ? <Text style={styles.loadingTxt}>Chargement...</Text>
                  : sessionReservations.length === 0
                    ? <Text style={styles.emptyResTxt}>Aucune réservation pour cette séance.</Text>
                    : (
                      <ScrollView style={{ maxHeight: 220 }}>
                        {sessionReservations.map((r: Reservation) => (
                          <View key={r.id} style={styles.resRow}>
                            <View style={styles.resLeft}>
                              <Text style={styles.resUser}>Membre #{r.utilisateur_id}</Text>
                              <Text style={styles.resDate}>{r.created_at?.slice(0, 10)}</Text>
                            </View>
                            <View style={styles.resRight}>
                              {r.checked_in
                                ? <Text style={styles.checkedBadge}>✓ Présent</Text>
                                : r.no_show
                                  ? <Text style={styles.noShowBadge}>Absent</Text>
                                  : (
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                      <TouchableOpacity style={[styles.resBtn, { borderColor: Colors.success }]}
                                        onPress={() => checkInMut.mutate({ uid: r.utilisateur_id, sid: selectedSession.id })}>
                                        <Text style={[styles.resBtnTxt, { color: Colors.success }]}>✓</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.resBtn, { borderColor: Colors.warning }]}
                                        onPress={() => noShowMut.mutate(r.id)}>
                                        <Text style={[styles.resBtnTxt, { color: Colors.warning }]}>✗</Text>
                                      </TouchableOpacity>
                                    </View>
                                  )
                              }
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Edit Session Modal ── */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Reprogrammer la séance</Text>
            <Text style={styles.editHint}>⚠️ Les membres réservés seront notifiés du changement.</Text>
            <Input label="Nouvelle date *" placeholder="2025-06-20" value={editDate} onChangeText={setEditDate} style={styles.field} />
            <Input label="Nouvelle heure *" placeholder="10:00" value={editHeure} onChangeText={setEditHeure} style={styles.field} />
            <View style={styles.sheetActions}>
              <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setShowEdit(false)} />
              <Button title="Reprogrammer" loading={updateMut.isPending} style={{ flex: 1 }}
                onPress={() => {
                  if (!selectedSession) return
                  if (!editDate || !editHeure) return Alert.alert('Requis', 'Date et heure obligatoires.')
                  updateMut.mutate({ id: selectedSession.id, body: { date: editDate, heure: editHeure } })
                }} />
            </View>
          </View>
        </View>
      </Modal>
      <AdminDrawer visible={visible} onClose={close} />

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8}, 
  adminLabel: { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  addBtn: { backgroundColor: Colors.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  addBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  calendar: { borderRadius: 16, marginHorizontal: 16, marginTop: 8, overflow: 'hidden' },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginTop: 12, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { color: Colors.textSecondary, fontSize: 12 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  dayTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', textTransform: 'capitalize', flex: 1 },
  dayCount: { color: Colors.textMuted, fontSize: 13 },
  emptyDay: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyDayTxt: { color: Colors.textMuted, fontSize: 15 },
  emptyDayLink: { color: Colors.blue, fontWeight: '700', fontSize: 14 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  timeStrip: { width: 62, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  timeStripTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
  sessionInfo: { flex: 1, padding: 12, gap: 3 },
  sessionSport: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15 },
  sessionCoach: { color: Colors.textSecondary, fontSize: 12 },
  sessionRight: { paddingRight: 14, alignItems: 'flex-end', gap: 4 },
  sessionFill: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15 },
  fullBadge: { backgroundColor: Colors.error + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  soloBadge: { backgroundColor: Colors.gold + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center' },
  sheet: { flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '92%', borderTopWidth: 1, borderColor: Colors.border },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  field: { marginBottom: 16 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceHigh },
  chipSm: { paddingVertical: 8 },
  chipActive: { backgroundColor: Colors.blueDim, borderColor: Colors.blue },
  chipTxt: { color: Colors.textSecondary, fontSize: 13 },
  chipTxtActive: { color: Colors.blue, fontWeight: '800' },
  coachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  coachChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  coachChipActive: { backgroundColor: Colors.blueDim, borderColor: Colors.blue },
  coachChipTxt: { color: Colors.textSecondary, fontSize: 13 },
  coachChipTxtActive: { color: Colors.blue, fontWeight: '700' },
  noCoach: { backgroundColor: Colors.warning + '15', borderRadius: 10, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: Colors.warning + '40' },
  noCoachTxt: { color: Colors.warning, fontSize: 13 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: Colors.blue },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.textMuted },
  toggleThumbOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  toggleLbl: { color: Colors.textSecondary, fontSize: 14 },
  recHint: { color: Colors.blue, fontSize: 12, marginBottom: 4 },
  sheetActions: { flexDirection: 'row', gap: 12 },
  // Detail modal
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  detailSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  fillCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  fillCircleTxt: { fontWeight: '900', fontSize: 14 },
  fillBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  fillBarFill: { height: 6, borderRadius: 3 },
  detailActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  detailBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  detailBtnTxt: { fontWeight: '700', fontSize: 13 },
  resLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  loadingTxt: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', padding: 12 },
  emptyResTxt: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', padding: 12 },
  resRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  resLeft: { gap: 2 },
  resUser: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  resDate: { color: Colors.textMuted, fontSize: 11 },
  resRight: { flexDirection: 'row', alignItems: 'center' },
  checkedBadge: { color: Colors.success, fontWeight: '700', fontSize: 13 },
  noShowBadge: { color: Colors.error, fontWeight: '700', fontSize: 13 },
  resBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  resBtnTxt: { fontWeight: '800', fontSize: 13 },
  // Edit modal
  editHint: { color: Colors.warning, fontSize: 13, marginBottom: 20 },
})