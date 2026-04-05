import api from './api'

export interface Coach {
  id: number
  nom: string
  specialite: string
  telephone: string
  bio?: string
  photo_url?: string
  is_active: boolean
  is_on_holiday: boolean
}

export const coachesService = {
  async getAll(sport?: string): Promise<Coach[]>              { return api.get('/coaches', { params: sport ? { sport } : {} }).then(r => r.data as Coach[]) },
  async getOne(id: number): Promise<Coach>                    { return api.get(`/coaches/${id}`).then(r => r.data as Coach) },
  async create(body: any): Promise<Coach>                     { return api.post('/coaches/', body).then(r => r.data as Coach) },
  async update(id: number, body: any): Promise<Coach>         { return api.put(`/coaches/${id}`, body).then(r => r.data as Coach) },
  async delete(id: number): Promise<void>                     { await api.delete(`/coaches/${id}`) },
  async toggleHoliday(id: number): Promise<Coach>             { return api.patch(`/coaches/${id}/holiday`).then(r => r.data as Coach) },
  async toggleActive(id: number): Promise<Coach>              { return api.patch(`/coaches/${id}/active`).then(r => r.data as Coach) },
}