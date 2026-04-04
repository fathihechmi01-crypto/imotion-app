import api from './api'

export const notificationsService = {
  async getMine(unread_only = false) {
    const { data } = await api.get('/notifications', { params: { unread_only } })
    return data
  },

  async markAllRead() {
    await api.patch('/notifications/read-all')
  },

  async markRead(id: number) {
    await api.patch(`/notifications/${id}/read`)
  },

  async broadcast(payload: { title: string; body: string; target?: string }) {
    const { data } = await api.post('/notifications/broadcast', payload)
    return data
  },
}
