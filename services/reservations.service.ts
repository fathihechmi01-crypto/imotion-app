import api from './api'

export const reservationsService = {
  async getMine() {
    const { data } = await api.get('/reservations')
    return data
  },

  async book(seance_id: number) {
    const { data } = await api.post('/reservations', { seance_id })
    return data
  },

  async cancel(reservation_id: number) {
    await api.delete(`/reservations/${reservation_id}`)
  },

  async getQR(seance_id: number) {
    const { data } = await api.get(`/checkin/${seance_id}/qr`)
    return data
  },

  async joinWaitlist(seance_id: number) {
    const { data } = await api.post(`/waitlist/${seance_id}`)
    return data
  },

  async leaveWaitlist(seance_id: number) {
    await api.delete(`/waitlist/${seance_id}`)
  },

  async getMyWaitlist() {
    const { data } = await api.get('/waitlist/me')
    return data
  },
}
