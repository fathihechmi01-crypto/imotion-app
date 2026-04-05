import api from './api'

export interface Paiement {
  id: number
  utilisateur_id: number
  montant: number
  statut: string
  stripe_payment_intent_id?: string
  description?: string
  created_at?: string
}

export interface PaySum {
  statut: string
  count: number
  total_eur: number
}

export const paiementsService = {
  async getMine(): Promise<Paiement[]>                          { return api.get('/paiements/me').then(r => r.data as Paiement[]) },
  async getAll(statut?: string): Promise<Paiement[]>           { return api.get('/paiements', { params: statut ? { statut } : {} }).then(r => r.data as Paiement[]) },
  async create(body: any): Promise<Paiement>                   { return api.post('/paiements', body).then(r => r.data as Paiement) },
  async updateStatut(id: number, statut: string): Promise<Paiement> { return api.patch(`/paiements/${id}/statut`, null, { params: { statut } }).then(r => r.data as Paiement) },
  async summary(): Promise<PaySum[]>                           { return api.get('/paiements/summary').then(r => r.data as PaySum[]) },
}