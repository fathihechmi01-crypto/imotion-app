import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar, DateData } from 'react-native-calendars'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsService } from '@/services/sessions.service'
import { reservationsService } from '@/services/reservations.service'
import { Colors, SportColors } from '@/constants/colors'
import { TopNav } from '@/components/ui/TopNav'
import { MemberDrawer, useMemberDrawer } from '@/components/ui/MemberDrawer'
import { Button } from '@/components/ui/Button'
import { format, isAfter } from 'date-fns'
import { fr } from 'date-fns/locale'

const SPORT_COLOR: Record<string, string> = {
  EMS: '#29ABE2', Cardio: '#E25A29', Musculation: '#29E27A',
}

export default function MemberCalendarScreen() {
  const { visible, open, close } = useMemberDrawer()
  const qc = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['sessions-all-member'],
    queryFn: () => sessionsService.getAll({ upcoming_only: false }),
  })

  const { data: myReservations = [] } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: reservationsService.getMine,
  })

  const { data: myWaitlist = [] } = useQuery({
    queryKey: ['my-waitlist'],
    queryFn: reservationsService.getMyWaitlist,
  })

  const bookMut = useMutation({
    mutationFn: (id: number) => reservationsService.book(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions-all-member'] })
      qc.invalidateQueries({ queryKey: ['my-reservations'] })
      Alert.alert('✅ Réservé !', 'Votre QR code est disponible dans Mes réservations.')
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Impossible de réserver'),
  })

  const waitlistMut = useMutation({
    mutationFn: (id: number) => reservationsService.joinWaitlist(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-waitlist'] })
      Alert.alert("Liste d'attente", "Vous serez notifié si une place se libère.")
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Impossible'),
  })

  const bookedIds = useMemo(() => new Set(myReservations.map((r: any) => r.seance_id)), [myReservations])
  const waitlistIds = useMemo(() => new Set(myWaitlist.map((w: any) => w.seance_id)), [myWaitlist])

  // Build calendar dots
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {}
    sessions.forEach((s: any) => {
      if (!marks[s.date]) marks[s.date] = { dots: [], marked: true }
      const color = SPORT_COLOR[s.sport] ?? Colors.blue
      if (!marks[s.date].dots.some((d: any) => d.color === color)) {
        marks[s.date].dots.push({ color, selectedDotColor: color })
      }
    })
    // Highlight selected
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: Colors.blue + '44' }
    } else {
      marks[selectedDate] = { selected: true, selectedColor: Colors.blue + '44', dots: [] }
    }
    return marks
  }, [sessions, selectedDate])

  const daySessions = useMemo(() =>
    sessions
      .filter((s: any) => s.date === selectedDate)
      .sort((a: any, b: any) => a.heure.localeCompare(b.heure)),
    [sessions, selectedDate])

  // My upcoming reservations for the selected date
  const dayReservations = useMemo(() =>
    myReservations.filter((r: any) => r.seance_date === selectedDate),
    [myReservations, selectedDate])

  const dateLabel = useMemo(() => {
    try {
      return format(new Date(selectedDate + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })
    } catch { return selectedDate }
  }, [selectedDate])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <TopNav title="Calendrier" subtitle="SÉANCES" onMenuPress={open} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Calendar */}
        <View style={styles.calWrap}>
          <Calendar
            style={styles.cal}
            theme={{
              backgroundColor: Colors.surface,
              calendarBackground: Colors.surface,
              textSectionTitleColor: Colors.textMuted,
              selectedDayBackgroundColor: Colors.blue,
              selectedDayTextColor: '#fff',
              todayTextColor: Colors.blue,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.textMuted,
              dotColor: Colors.blue,
              arrowColor: Colors.blue,
              monthTextColor: Colors.textPrimary,
              textMonthFontWeight: '700',
              textDayFontSize: 13,
              textMonthFontSize: 15,
            }}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            enableSwipeMonths
          />
          {/* Sport legend */}
          <View style={styles.legend}>
            {Object.entries(SPORT_COLOR).map(([sport, color]) => (
              <View key={sport} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendTxt}>{sport}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected day header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{dateLabel}</Text>
          <Text style={styles.dayCount}>
            {daySessions.length} séance{daySessions.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* My reservations badge for this day */}
        {dayReservations.length > 0 && (
          <View style={styles.myResaBanner}>
            <Text style={styles.myResaTxt}>
              ✅ Vous avez {dayReservations.length} réservation{dayReservations.length > 1 ? 's' : ''} ce jour
            </Text>
          </View>
        )}

        {/* Sessions for selected day */}
        {daySessions.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayTxt}>Aucune séance ce jour</Text>
          </View>
        ) : (
          daySessions.map((s: any) => {
            const isBooked = bookedIds.has(s.id)
            const isWaiting = waitlistIds.has(s.id)
            const isPast = !isAfter(new Date(`${s.date}T${s.heure}`), new Date())
            const sportColor = SPORT_COLOR[s.sport] ?? Colors.blue
            const fillPct = s.capacite > 0 ? Math.round(s.reservations / s.capacite * 100) : 0

            return (
              <View key={s.id} style={styles.sessionCard}>
                <View style={[styles.sportStrip, { backgroundColor: sportColor }]}>
                  <Text style={styles.timeText}>{s.heure?.slice(0, 5)}</Text>
                </View>
                <View style={styles.sessionBody}>
                  <Text style={styles.sessionSport}>{s.sport}</Text>
                  <Text style={styles.sessionCoach}>{s.coach_nom ?? 'Coach'}</Text>
                  {/* Fill bar */}
                  <View style={styles.fillRow}>
                    <View style={styles.fillTrack}>
                      <View style={[styles.fillBar, {
                        width: `${fillPct}%` as any,
                        backgroundColor: fillPct >= 100 ? Colors.error : Colors.success,
                      }]} />
                    </View>
                    <Text style={styles.fillTxt}>
                      {s.is_full ? 'Complet' : `${s.reservations}/${s.capacite}`}
                    </Text>
                  </View>
                </View>

                {/* Action button */}
                <View style={styles.sessionAction}>
                  {isPast ? (
                    <View style={styles.pastBadge}><Text style={styles.pastTxt}>Passée</Text></View>
                  ) : isBooked ? (
                    <View style={styles.bookedBadge}><Text style={styles.bookedTxt}>✓ Réservé</Text></View>
                  ) : isWaiting ? (
                    <View style={styles.waitBadge}><Text style={styles.waitTxt}>⏳ Attente</Text></View>
                  ) : s.is_full ? (
                    <Button title="Attente" size="sm" variant="ghost"
                      onPress={() => waitlistMut.mutate(s.id)}
                      loading={waitlistMut.isPending} />
                  ) : (
                    <Button title="Réserver" size="sm"
                      onPress={() => bookMut.mutate(s.id)}
                      loading={bookMut.isPending} />
                  )}
                </View>
              </View>
            )
          })
        )}

        {/* My reservations section */}
        {myReservations.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>MES RÉSERVATIONS</Text>
              <Text style={styles.sectionCount}>{myReservations.length} au total</Text>
            </View>
            {myReservations
              .filter((r: any) => isAfter(new Date(`${r.seance_date}T${r.seance_heure}`), new Date()))
              .slice(0, 5)
              .map((r: any) => (
                <View key={r.id} style={styles.resaRow}>
                  <View style={[styles.resaDot, { backgroundColor: SPORT_COLOR[r.seance_sport] ?? Colors.blue }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resaSport}>{r.seance_sport}</Text>
                    <Text style={styles.resaDate}>
                      {r.seance_date} · {r.seance_heure?.slice(0, 5)}
                    </Text>
                  </View>
                  <View style={styles.resaCheck}>
                    <Text style={styles.resaCheckTxt}>✓</Text>
                  </View>
                </View>
              ))}
          </>
        )}
      </ScrollView>

      <MemberDrawer visible={visible} onClose={close} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  calWrap:       { margin: 12, backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  cal:           { borderRadius: 16 },
  legend:        { flexDirection: 'row', gap: 16, padding: 12, justifyContent: 'center' },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendTxt:     { color: Colors.textSecondary, fontSize: 11 },
  dayHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  dayTitle:      { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', textTransform: 'capitalize', flex: 1 },
  dayCount:      { color: Colors.textMuted, fontSize: 13 },
  myResaBanner:  { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.success + '18', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.success + '40' },
  myResaTxt:     { color: Colors.success, fontWeight: '600', fontSize: 13 },
  emptyDay:      { alignItems: 'center', paddingVertical: 28 },
  emptyDayTxt:   { color: Colors.textMuted, fontSize: 14 },
  sessionCard:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  sportStrip:    { width: 58, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  timeText:      { color: '#fff', fontWeight: '900', fontSize: 12 },
  sessionBody:   { flex: 1, padding: 10, gap: 2 },
  sessionSport:  { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  sessionCoach:  { color: Colors.textSecondary, fontSize: 11 },
  fillRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  fillTrack:     { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  fillBar:       { height: 4, borderRadius: 2 },
  fillTxt:       { color: Colors.textMuted, fontSize: 10, width: 44, textAlign: 'right' },
  sessionAction: { paddingRight: 10 },
  pastBadge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.surfaceHigh },
  pastTxt:       { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  bookedBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.success + '20', borderWidth: 1, borderColor: Colors.success + '40' },
  bookedTxt:     { color: Colors.success, fontSize: 11, fontWeight: '700' },
  waitBadge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.warning + '20', borderWidth: 1, borderColor: Colors.warning + '40' },
  waitTxt:       { color: Colors.warning, fontSize: 11, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionLabel:  { color: Colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  sectionCount:  { color: Colors.textMuted, fontSize: 12 },
  resaRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  resaDot:       { width: 10, height: 10, borderRadius: 5 },
  resaSport:     { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  resaDate:      { color: Colors.textSecondary, fontSize: 11 },
  resaCheck:     { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center' },
  resaCheckTxt:  { color: Colors.success, fontSize: 12, fontWeight: '800' },
})