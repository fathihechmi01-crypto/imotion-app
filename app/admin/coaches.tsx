import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Colors, SportColors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'

const fetchCoaches = () => api.get('/coaches').then(r => r.data)
const toggleHoliday = (id: number) => api.patch(`/coaches/${id}/holiday`).then(r => r.data)
const toggleActive  = (id: number) => api.patch(`/coaches/${id}/active`).then(r => r.data)
const deleteCoach   = (id: number) => api.delete(`/coaches/${id}`)

export default function AdminCoachesScreen() {
  const qc = useQueryClient()
  const { data: coaches = [], isLoading, refetch } = useQuery({ queryKey: ['coaches'], queryFn: fetchCoaches })

  const holidayMutation = useMutation({ mutationFn: toggleHoliday, onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }) })
  const activeMutation  = useMutation({ mutationFn: toggleActive,  onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }) })
  const deleteMutation  = useMutation({
    mutationFn: deleteCoach,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaches'] }); Alert.alert('Supprimé') },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.detail),
  })

  const confirmDelete = (id: number, nom: string) => {
    Alert.alert(`Supprimer ${nom} ?`, 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={styles.header}>
        <Text style={styles.adminLabel}>ADMIN</Text>
        <Text style={styles.title}>Coaches</Text>
        <Text style={styles.count}>{coaches.length} coach{coaches.length !== 1 ? 'es' : ''}</Text>
      </View>

      <FlatList
        data={coaches}
        keyExtractor={(c) => c.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        renderItem={({ item: c }) => {
          const sportColor = SportColors[c.specialite] ?? Colors.blue
          return (
            <Card style={[styles.card, { borderLeftColor: sportColor, borderLeftWidth: 3 }]} elevated>
              {/* Top row */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{c.nom.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachName}>{c.nom}</Text>
                  <View style={[styles.sportTag, { backgroundColor: sportColor + '22', borderColor: sportColor }]}>
                    <Text style={[styles.sportTagText, { color: sportColor }]}>{c.specialite}</Text>
                  </View>
                </View>
                <View style={styles.statusDots}>
                  <View style={[styles.dot, { backgroundColor: c.is_active ? Colors.success : Colors.error }]} />
                  {c.is_on_holiday && <Text style={styles.holidayIcon}>🌴</Text>}
                </View>
              </View>

              {c.telephone && <Text style={styles.phone}>📞 {c.telephone}</Text>}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: c.is_on_holiday ? Colors.success : Colors.warning }]}
                  onPress={() => holidayMutation.mutate(c.id)}
                >
                  <Text style={[styles.actionText, { color: c.is_on_holiday ? Colors.success : Colors.warning }]}>
                    {c.is_on_holiday ? '✓ En congé' : '🌴 Congé'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: c.is_active ? Colors.error : Colors.success }]}
                  onPress={() => activeMutation.mutate(c.id)}
                >
                  <Text style={[styles.actionText, { color: c.is_active ? Colors.error : Colors.success }]}>
                    {c.is_active ? 'Désactiver' : '✓ Activer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: Colors.error + '60' }]}
                  onPress={() => confirmDelete(c.id, c.nom)}
                >
                  <Text style={[styles.actionText, { color: Colors.error }]}>🗑</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  adminLabel:   { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title:        { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  count:        { color: Colors.textMuted, fontSize: 14, marginTop: 2 },
  list:         { paddingHorizontal: 20, paddingBottom: 24 },
  card:         { marginBottom: 12, gap: 10 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blueDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.blue },
  avatarText:   { color: Colors.blue, fontWeight: '800', fontSize: 18 },
  coachName:    { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sportTag:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  sportTagText: { fontSize: 11, fontWeight: '700' },
  statusDots:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  holidayIcon:  { fontSize: 14 },
  phone:        { color: Colors.textSecondary, fontSize: 13 },
  actions:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionText:   { fontSize: 12, fontWeight: '700' },
})
