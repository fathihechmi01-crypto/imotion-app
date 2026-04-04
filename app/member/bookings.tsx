import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, RefreshControl, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import QRCode from 'react-native-qrcode-svg'
import { reservationsService } from '@/services/reservations.service'
import { Colors, SportColors } from '@/constants/colors'
import { SportBadge } from '@/components/ui/SportBadge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const { width } = Dimensions.get('window')

export default function BookingsScreen() {
  const [qrModal, setQrModal] = useState<{ seanceId: number; token: string; sport: string } | null>(null)
  const qc = useQueryClient()

  const { data: reservations = [], isLoading, refetch } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: reservationsService.getMine,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => reservationsService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-reservations'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      Alert.alert('Annulée', 'Votre réservation a été annulée.')
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail ?? 'Annulation impossible'),
  })

  const handleShowQR = async (seanceId: number, sport: string) => {
    try {
      const data = await reservationsService.getQR(seanceId)
      setQrModal({ seanceId, token: data.qr_token, sport })
    } catch {
      Alert.alert('Erreur', 'QR code indisponible')
    }
  }

  const confirmCancel = (id: number) => {
    Alert.alert('Annuler ?', 'Annuler cette réservation ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, annuler', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
    ])
  }

  const upcoming = reservations.filter((r: any) => {
    const d = new Date(`${r.seance_date}T${r.seance_heure}`)
    return d > new Date()
  })
  const past = reservations.filter((r: any) => {
    const d = new Date(`${r.seance_date}T${r.seance_heure}`)
    return d <= new Date()
  })

  const renderItem = ({ item }: { item: any }) => {
    const date = new Date(`${item.seance_date}T${item.seance_heure}`)
    const isPast = date <= new Date()
    const color = SportColors[item.seance_sport] ?? Colors.blue

    return (
      <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
        <View style={styles.cardHeader}>
          <View style={{ gap: 4 }}>
            <Text style={styles.dateText}>
              {format(date, 'EEEE d MMM', { locale: fr })}
            </Text>
            <Text style={styles.timeText}>{item.seance_heure?.slice(0, 5)} · {item.coach_nom ?? 'Sans coach'}</Text>
          </View>
          <SportBadge sport={item.seance_sport} />
        </View>

        <View style={styles.cardFooter}>
          {item.checked_in && (
            <View style={styles.checkedBadge}>
              <Text style={styles.checkedText}>✓ Présent</Text>
            </View>
          )}
          {item.no_show && (
            <View style={[styles.checkedBadge, { backgroundColor: Colors.error + '20', borderColor: Colors.error }]}>
              <Text style={[styles.checkedText, { color: Colors.error }]}>Absent</Text>
            </View>
          )}
          {!isPast && !item.checked_in && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.qrBtn} onPress={() => handleShowQR(item.seance_id, item.seance_sport)}>
                <Text style={styles.qrBtnText}>📱 QR Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item.id)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Réservations</Text>
        <Text style={styles.count}>{upcoming.length} à venir</Text>
      </View>

      <FlatList
        data={[...upcoming, ...past]}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        ListHeaderComponent={upcoming.length > 0 && past.length > 0 ? (
          <Text style={styles.sectionLabel}>À VENIR</Text>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Aucune réservation</Text>
          </View>
        }
        renderItem={renderItem}
      />

      {/* QR Modal */}
      <Modal visible={!!qrModal} transparent animationType="fade" onRequestClose={() => setQrModal(null)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setQrModal(null)} activeOpacity={1}>
          <View style={styles.qrSheet}>
            <Text style={styles.qrTitle}>Votre QR Code</Text>
            <Text style={styles.qrSub}>Présentez-le à l'accueil</Text>
            <View style={styles.qrBox}>
              {qrModal && (
                <QRCode
                  value={qrModal.token}
                  size={width * 0.55}
                  color={Colors.black}
                  backgroundColor="#fff"
                />
              )}
            </View>
            <View style={styles.qrSportBadge}>
              {qrModal && <SportBadge sport={qrModal.sport} />}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModal(null)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:        { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  count:        { color: Colors.blue, fontSize: 14, fontWeight: '700' },
  list:         { paddingHorizontal: 20, paddingBottom: 20 },
  sectionLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },
  card:         { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  dateText:     { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  timeText:     { color: Colors.textSecondary, fontSize: 13 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions:      { flexDirection: 'row', gap: 8 },
  qrBtn:        { backgroundColor: Colors.blueDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.blue },
  qrBtnText:    { color: Colors.blue, fontWeight: '700', fontSize: 13 },
  cancelBtn:    { backgroundColor: Colors.error + '15', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.error + '40' },
  cancelBtnText:{ color: Colors.error, fontWeight: '700', fontSize: 13 },
  checkedBadge: { backgroundColor: Colors.success + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.success },
  checkedText:  { color: Colors.success, fontWeight: '700', fontSize: 13 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:    { fontSize: 48 },
  emptyText:    { color: Colors.textMuted, fontSize: 16 },
  // QR modal
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  qrSheet:      { backgroundColor: Colors.surface, borderRadius: 28, padding: 32, alignItems: 'center', gap: 12, width: width - 48, borderWidth: 1, borderColor: Colors.border },
  qrTitle:      { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  qrSub:        { color: Colors.textMuted, fontSize: 13 },
  qrBox:        { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginVertical: 8 },
  qrSportBadge: { marginBottom: 4 },
  closeBtn:     { marginTop: 8, backgroundColor: Colors.surfaceHigh, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  closeBtnText: { color: Colors.textSecondary, fontWeight: '700' },
})
