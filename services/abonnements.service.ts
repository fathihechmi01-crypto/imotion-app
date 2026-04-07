import api from './api'

export interface Abonnement {
  id: number
  type: string
  date_debut: string
  date_fin: string
  utilisateur_id: number
  is_paid: boolean
  stripe_subscription_id?: string
}

export interface AbonnementExpiring {
  utilisateur_id: number
  nom: string
  email: string
  type: string
  date_fin: string
  days_left: number
}

export const abonnementsService = {
  async getMine(): Promise<Abonnement | null>                    { return api.get('/abonnements/me').then(r => r.data as Abonnement) },
  async getAll(): Promise<Abonnement[]>                          { return api.get('/abonnements/').then(r => r.data as Abonnement[]) }, 
  async create(body: any): Promise<Abonnement>                   { return api.post('/abonnements', body).then(r => r.data as Abonnement) },
  async markPaid(id: number): Promise<Abonnement>                { return api.patch(`/abonnements/${id}/pay`).then(r => r.data as Abonnement) },
  async delete(id: number): Promise<void>                        { await api.delete(`/abonnements/${id}`) },
  async expiringSoon(days = 7): Promise<AbonnementExpiring[]>    { return api.get('/abonnements/expiring-soon', { params: { days } }).then(r => r.data as AbonnementExpiring[]) },
}