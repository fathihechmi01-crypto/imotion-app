import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, SportColors } from '@/constants/colors'
import { SportBadge } from '@/components/ui/SportBadge'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Session {
  id: number
  date: string
  heure: string
  sport: string
  capacite: number
  reservations: number
  is_full: boolean
  solo_taken: boolean
  is_solo: boolean
  coach_nom: string | null
}

interface Props {
  session: Session
  onBook?: () => void
  onWaitlist?: () => void
  isBooked?: boolean
  isWaiting?: boolean
  loading?: boolean
}

export function SessionCard({ session, onBook, onWaitlist, isBooked, isWaiting, loading }: Props) {
  const color = SportColors[session.sport] ?? Colors.blue
  const fillPct = session.capacite > 0 ? session.reservations / session.capacite : 0
  const isFull = session.is_full || session.solo_taken
  const dateObj = new Date(`${session.date}T${session.heure}`)
  const isPast = dateObj < new Date()

  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <Text style={styles.time}>
            {format(dateObj, 'EEE d MMM', { locale: fr })} · {session.heure.slice(0, 5)}
          </Text>
          <Text style={styles.coach}>
            {session.coach_nom ?? 'Sans coach'}
            {session.is_solo && <Text style={styles.soloTag}> · SOLO</Text>}
          </Text>
        </View>
        <SportBadge sport={session.sport} />
      </View>

      {/* Fill bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, {
          width: `${Math.round(fillPct * 100)}%` as any,
          backgroundColor: fillPct >= 1 ? Colors.error : color,
        }]} />
      </View>
      <Text style={styles.spots}>
        {isFull ? 'Complet' : `${session.capacite - session.reservations} place${session.capacite - session.reservations > 1 ? 's' : ''} disponible${session.capacite - session.reservations > 1 ? 's' : ''}`}
        <Text style={styles.spotsMuted}> · {session.reservations}/{session.capacite}</Text>
      </Text>

      {/* Action */}
      {!isPast && (
        <View style={styles.actions}>
          {isBooked ? (
            <View style={styles.bookedBadge}>
              <Text style={styles.bookedText}>✓ Réservé</Text>
            </View>
          ) : isWaiting ? (
            <View style={[styles.bookedBadge, { backgroundColor: Colors.goldDim, borderColor: Colors.gold }]}>
              <Text style={[styles.bookedText, { color: Colors.gold }]}>⏳ Liste d'attente</Text>
            </View>
          ) : isFull ? (
            <Button title="Liste d'attente" onPress={onWaitlist!} variant="ghost" size="sm" loading={loading} />
          ) : (
            <Button title="Réserver" onPress={onBook!} variant="primary" size="sm" loading={loading} />
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card:       { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  time:       { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  coach:      { color: Colors.textSecondary, fontSize: 13 },
  soloTag:    { color: Colors.gold, fontWeight: '700' },
  barBg:      { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  barFill:    { height: 4, borderRadius: 2 },
  spots:      { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  spotsMuted: { color: Colors.textMuted, fontWeight: '400' },
  actions:    { alignItems: 'flex-start' },
  bookedBadge:{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.success + '22', borderWidth: 1, borderColor: Colors.success },
  bookedText: { color: Colors.success, fontWeight: '700', fontSize: 13 },
})
