import { View, Text, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsService } from '@/services/sessions.service'
import { AdminCalendar } from '@/components/calendar/AdminCalendar'
import { Colors } from '@/constants/colors'

export default function AdminCalendarScreen() {
  const qc = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions-all'],
    queryFn: () => sessionsService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: sessionsService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions-all'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      Alert.alert('Supprimée', 'La séance a été supprimée. Les membres réservés ont été notifiés.')
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Suppression impossible'),
  })

  const confirmDelete = (id: number) => {
    Alert.alert(
      'Supprimer la séance ?',
      'Tous les membres réservés seront notifiés automatiquement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={styles.header}>
        <Text style={styles.adminLabel}>ADMIN</Text>
        <Text style={styles.title}>Calendrier</Text>
      </View>
      <AdminCalendar sessions={sessions} onDeleteSession={confirmDelete} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:     { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  adminLabel: { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title:      { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
})
