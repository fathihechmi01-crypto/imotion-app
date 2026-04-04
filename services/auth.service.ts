import api, { saveToken, removeToken } from './api'

export interface LoginPayload { email: string; mot_de_passe: string }
export interface RegisterPayload { nom: string; email: string; mot_de_passe: string; telephone?: string }

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post('/auth/login', payload)
    await saveToken(data.access_token)
    return data
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  async logout() {
    await removeToken()
  },

  async me() {
    const { data } = await api.get('/users/me')
    return data
  },
}