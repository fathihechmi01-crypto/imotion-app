import api from './api'

export const sessionsService = {
  async getAll(params?: { sport?: string; upcoming_only?: boolean }) {
    const { data } = await api.get('/seances', { params })
    return data
  },

  async create(payload: any) {
    const { data } = await api.post('/seances', payload)
    return data
  },

  async update(id: number, payload: { date: string; heure: string }) {
    const { data } = await api.put(`/seances/${id}`, payload)
    return data
  },

  async delete(id: number) {
    await api.delete(`/seances/${id}`)
  },
}
