import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'
import { Colors } from '@/constants/colors'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  confirmation: { icon: '✅', color: Colors.success },
  cancellation: { icon: '❌', color: Colors.error },
  reschedule:   { icon: '⏰', color: Colors.warning },
  waitlist:     { icon: '🎉', color: Colors.gold },
  no_show:      { icon: '⚠️', color: Colors.warning },
  broadcast:    { icon: '📢', color: Colors.blue },
  subscription: { icon: '🌟', color: Colors.gold },
  reminder:     { icon: '🔔', color: Colors.blue },
}

export default function NotificationsScreen() {
  const qc = useQueryClient()

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getMine(),
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllMutation.mutate()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type] ?? { icon: '📌', color: Colors.blue }
          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.is_read && styles.notifUnread]}
              onPress={() => !item.is_read && markOneMutation.mutate(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: cfg.color + '22' }]}>
                <Text style={styles.icon}>{cfg.icon}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTime}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                </Text>
              </View>
              {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  title:        { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  unreadCount:  { color: Colors.blue, fontSize: 13, fontWeight: '600', marginTop: 2 },
  markAllBtn:   { backgroundColor: Colors.blueDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.blue },
  markAllText:  { color: Colors.blue, fontWeight: '700', fontSize: 13 },
  list:         { paddingHorizontal: 20, paddingBottom: 20 },
  notifCard:    { flexDirection: 'row', gap: 14, alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  notifUnread:  { borderColor: Colors.blue + '40', backgroundColor: Colors.blueDim },
  iconBox:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon:         { fontSize: 20 },
  notifTitle:   { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  notifBody:    { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  notifTime:    { color: Colors.textMuted, fontSize: 11 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:    { fontSize: 48 },
  emptyText:    { color: Colors.textMuted, fontSize: 16 },
})
