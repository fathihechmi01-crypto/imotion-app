import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { Colors, SportColors } from '@/constants/colors'
import { SportBadge } from '@/components/ui/SportBadge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const { height } = Dimensions.get('window')

interface Session {
  id: number
  date: string
  heure: string
  sport: string
  capacite: number
  reservations: number
  is_full: boolean
  coach_nom: string | null
}

interface Props {
  sessions: Session[]
  onDeleteSession?: (id: number) => void
}

export function AdminCalendar({ sessions, onDeleteSession }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [modalSession, setModalSession] = useState<Session | null>(null)

  // Build marked dates: dots per sport
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {}
    sessions.forEach((s) => {
      const color = SportColors[s.sport] ?? Colors.blue
      if (!marks[s.date]) {
        marks[s.date] = { dots: [], marked: true }
      }
      const alreadyHasDot = marks[s.date].dots.some((d: any) => d.color === color)
      if (!alreadyHasDot) {
        marks[s.date].dots.push({ color, selectedDotColor: color })
      }
    })

    // Highlight selected
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true
      marks[selectedDate].selectedColor = Colors.blueDim
    } else {
      marks[selectedDate] = { selected: true, selectedColor: Colors.blueDim }
    }

    return marks
  }, [sessions, selectedDate])

  const sessionsForDay = useMemo(() =>
    sessions
      .filter((s) => s.date === selectedDate)
      .sort((a, b) => a.heure.localeCompare(b.heure)),
    [sessions, selectedDate]
  )

  const selectedLabel = useMemo(() => {
    try {
      return format(new Date(selectedDate + 'T00:00:00'), 'EEEE d MMMM yyyy', { locale: fr })
    } catch { return selectedDate }
  }, [selectedDate])

  return (
    <View style={styles.container}>
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
          indicatorColor: Colors.blue,
          arrowColor: Colors.blue,
          textMonthFontWeight: '700',
          textDayFontSize: 14,
          textMonthFontSize: 16,
        }}
        style={styles.calendar}
      />

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(SportColors).map(([sport, color]) => (
          <View key={sport} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{sport}</Text>
          </View>
        ))}
      </View>

      {/* Day sessions */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{selectedLabel}</Text>
        <Text style={styles.dayCount}>
          {sessionsForDay.length} séance{sessionsForDay.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
        {sessionsForDay.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune séance ce jour</Text>
          </View>
        ) : (
          sessionsForDay.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.sessionRow}
              onPress={() => setModalSession(s)}
              activeOpacity={0.7}
            >
              <View style={[styles.timeStrip, { backgroundColor: SportColors[s.sport] ?? Colors.blue }]}>
                <Text style={styles.timeText}>{s.heure.slice(0, 5)}</Text>
              </View>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionInfoRow}>
                  <Text style={styles.sessionSport}>{s.sport}</Text>
                  <SportBadge sport={s.sport} />
                </View>
                <Text style={styles.sessionCoach}>{s.coach_nom ?? 'Sans coach'}</Text>
              </View>
              <View style={styles.fillInfo}>
                <Text style={[styles.fillText, s.is_full && { color: Colors.error }]}>
                  {s.reservations}/{s.capacite}
                </Text>
                {s.is_full && <Text style={styles.fullBadge}>COMPLET</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Session detail modal */}
      <Modal
        visible={!!modalSession}
        transparent
        animationType="slide"
        onRequestClose={() => setModalSession(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalSession(null)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            {modalSession && (
              <>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Séance #{modalSession.id}</Text>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Sport</Text>
                  <SportBadge sport={modalSession.sport} />
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Heure</Text>
                  <Text style={styles.modalValue}>{modalSession.heure.slice(0, 5)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Coach</Text>
                  <Text style={styles.modalValue}>{modalSession.coach_nom ?? '—'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Réservations</Text>
                  <Text style={[styles.modalValue, modalSession.is_full && { color: Colors.error }]}>
                    {modalSession.reservations} / {modalSession.capacite}
                  </Text>
                </View>

                {/* Fill bar */}
                <View style={styles.modalBarBg}>
                  <View style={[styles.modalBarFill, {
                    width: `${Math.round(modalSession.reservations / modalSession.capacite * 100)}%` as any,
                    backgroundColor: modalSession.is_full ? Colors.error : SportColors[modalSession.sport] ?? Colors.blue,
                  }]} />
                </View>

                {onDeleteSession && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => { onDeleteSession(modalSession.id); setModalSession(null) }}
                  >
                    <Text style={styles.deleteBtnText}>🗑 Supprimer cette séance</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.black },
  calendar:       { borderRadius: 16, marginHorizontal: 16, marginTop: 8, overflow: 'hidden' },
  legend:         { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  legendLabel:    { color: Colors.textSecondary, fontSize: 12 },
  dayHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  dayTitle:       { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  dayCount:       { color: Colors.textMuted, fontSize: 13 },
  sessionList:    { flex: 1, paddingHorizontal: 16 },
  empty:          { alignItems: 'center', paddingVertical: 40 },
  emptyText:      { color: Colors.textMuted, fontSize: 15 },
  sessionRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  timeStrip:      { width: 60, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  timeText:       { color: '#fff', fontWeight: '800', fontSize: 13 },
  sessionInfo:    { flex: 1, padding: 12, gap: 4 },
  sessionInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionSport:   { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  sessionCoach:   { color: Colors.textSecondary, fontSize: 12 },
  fillInfo:       { paddingRight: 14, alignItems: 'flex-end', gap: 4 },
  fillText:       { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  fullBadge:      { backgroundColor: Colors.error + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  // Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16, borderTopWidth: 1, borderColor: Colors.border },
  modalHandle:    { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle:     { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  modalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalLabel:     { color: Colors.textSecondary, fontSize: 14 },
  modalValue:     { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  modalBarBg:     { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  modalBarFill:   { height: 6, borderRadius: 3 },
  deleteBtn:      { backgroundColor: Colors.error + '15', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '40' },
  deleteBtnText:  { color: Colors.error, fontWeight: '700', fontSize: 14 },
})
