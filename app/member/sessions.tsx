import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { sessionsService } from '@/services/sessions.service'
import { reservationsService } from '@/services/reservations.service'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'
import { SessionCard } from '@/components/sessions/SessionCard'

const SPORTS = ['Tous', 'EMS', 'Cardio', 'Musculation']

export default function SessionsScreen() {
  const [selectedSport, setSelectedSport] = useState('Tous')
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsService.getAll({ upcoming_only: true }),
  })

  const { data: myReservations = [] } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: reservationsService.getMine,
  })

  const { data: myWaitlist = [] } = useQuery({
    queryKey: ['my-waitlist'],
    queryFn: reservationsService.getMyWaitlist,
  })

  const bookMutation = useMutation({
    mutationFn: (seance_id: number) => reservationsService.book(seance_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['my-reservations'] })
      Alert.alert('✅ Réservé !', 'Votre séance est confirmée. Votre QR code est disponible.')
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Réservation impossible'),
  })

  const waitlistMutation = useMutation({
    mutationFn: (seance_id: number) => reservationsService.joinWaitlist(seance_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-waitlist'] })
      Alert.alert("Liste d'attente", "Vous serez notifié si une place se libère.")
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? "Impossible de rejoindre la liste d'attente"),
  })

  const bookedIds = new Set(myReservations.map((r: any) => r.seance_id))
  const waitlistIds = new Set(myWaitlist.map((w: any) => w.seance_id))

  const filtered = selectedSport === 'Tous'
    ? sessions
    : sessions.filter((s: any) => s.sport === selectedSport)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      {/* Header */}
      <LinearGradient colors={['rgba(41,171,226,0.12)', 'transparent']} style={styles.headerGlow} pointerEvents="none" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.nom?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Choisissez votre séance</Text>
        </View>
      </View>

      {/* Sport filter */}
      <View style={styles.filterRow}>
        {SPORTS.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[styles.filterChip, selectedSport === sport && styles.filterChipActive]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text style={[styles.filterText, selectedSport === sport && styles.filterTextActive]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sessions list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyText}>Aucune séance disponible</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            isBooked={bookedIds.has(item.id)}
            isWaiting={waitlistIds.has(item.id)}
            loading={bookMutation.isPending || waitlistMutation.isPending}
            onBook={() => bookMutation.mutate(item.id)}
            onWaitlist={() => waitlistMutation.mutate(item.id)}
          />
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  headerGlow:       { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  greeting:         { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle:         { color: Colors.textMuted, fontSize: 14, marginTop: 2 },
  filterRow:        { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterChip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.blueDim, borderColor: Colors.blue },
  filterText:       { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: Colors.blue },
  list:             { paddingHorizontal: 20, paddingBottom: 20 },
  empty:            { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:        { fontSize: 48 },
  emptyText:        { color: Colors.textMuted, fontSize: 16 },
})
