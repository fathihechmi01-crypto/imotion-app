import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'

const fetchMembers = () => api.get('/users').then(r => r.data)
const unflagMember = (id: number) => api.patch(`/users/${id}/unflag`).then(r => r.data)

export default function AdminMembersScreen() {
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data: members = [], isLoading, refetch } = useQuery({ queryKey: ['members'], queryFn: fetchMembers })
  const unflagMutation = useMutation({
    mutationFn: unflagMember,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); Alert.alert('Désinscrit', 'Le membre a été réhabilité.') },
  })

  const filtered = members.filter((m: any) =>
    m.nom.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const flagged = filtered.filter((m: any) => m.is_flagged)
  const normal  = filtered.filter((m: any) => !m.is_flagged)

  const renderMember = ({ item: m }: { item: any }) => (
    <Card style={[styles.card, m.is_flagged && styles.flaggedCard]} elevated>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: m.is_flagged ? Colors.warning + '22' : Colors.blueDim, borderColor: m.is_flagged ? Colors.warning : Colors.blue }]}>
          <Text style={[styles.avatarText, { color: m.is_flagged ? Colors.warning : Colors.blue }]}>
            {m.nom.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.name}>{m.nom}</Text>
            {m.is_admin === 1 && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>}
          </View>
          <Text style={styles.email}>{m.email}</Text>
          {m.telephone && <Text style={styles.phone}>{m.telephone}</Text>}
        </View>
        {m.is_flagged && (
          <TouchableOpacity style={styles.unflagBtn} onPress={() => unflagMutation.mutate(m.id)}>
            <Text style={styles.unflagText}>Réhabiliter</Text>
          </TouchableOpacity>
        )}
      </View>
      {m.is_flagged && (
        <View style={styles.flagWarning}>
          <Text style={styles.flagWarningText}>⚠️ {m.no_show_count} absence{m.no_show_count > 1 ? 's' : ''} non justifiée{m.no_show_count > 1 ? 's' : ''}</Text>
        </View>
      )}
    </Card>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={styles.header}>
        <Text style={styles.adminLabel}>ADMIN</Text>
        <Text style={styles.title}>Membres</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un membre..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={[...flagged, ...normal]}
        keyExtractor={(m) => m.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        ListHeaderComponent={flagged.length > 0 ? (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>⚠️ MEMBRES SIGNALÉS ({flagged.length})</Text>
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun membre trouvé</Text>
          </View>
        }
        renderItem={renderMember}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:           { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  adminLabel:       { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title:            { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  searchBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  searchIcon:       { fontSize: 16 },
  searchInput:      { flex: 1, height: 46, color: Colors.textPrimary, fontSize: 15 },
  list:             { paddingHorizontal: 20, paddingBottom: 24 },
  sectionHeader:    { marginBottom: 10 },
  sectionLabel:     { color: Colors.warning, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  card:             { marginBottom: 10, gap: 8 },
  flaggedCard:      { borderColor: Colors.warning + '40' },
  cardRow:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:           { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText:       { fontWeight: '800', fontSize: 18 },
  name:             { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  email:            { color: Colors.textSecondary, fontSize: 12 },
  phone:            { color: Colors.textMuted, fontSize: 12 },
  adminBadge:       { backgroundColor: Colors.gold + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.gold },
  adminBadgeText:   { color: Colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  unflagBtn:        { backgroundColor: Colors.success + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.success },
  unflagText:       { color: Colors.success, fontWeight: '700', fontSize: 12 },
  flagWarning:      { backgroundColor: Colors.warning + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  flagWarningText:  { color: Colors.warning, fontSize: 12, fontWeight: '600' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { color: Colors.textMuted, fontSize: 15 },
})
