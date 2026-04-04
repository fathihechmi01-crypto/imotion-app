import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { API_URL } from '@/constants/api'

// SecureStore is not available on web — use localStorage fallback
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem('imotion_token')
  return SecureStore.getItemAsync('imotion_token')
}

export const saveToken = async (token: string) => {
  if (Platform.OS === 'web') localStorage.setItem('imotion_token', token)
  else await SecureStore.setItemAsync('imotion_token', token)
}

export const removeToken = async () => {
  if (Platform.OS === 'web') localStorage.removeItem('imotion_token')
  else await SecureStore.deleteItemAsync('imotion_token')
}

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) removeToken()
    return Promise.reject(err)
  }
)

export default api