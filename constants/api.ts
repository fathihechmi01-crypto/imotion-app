import { Platform } from 'react-native'

const LOCAL_IP = '192.168.0.56'

const getBaseUrl = (): string => {
  // Web browser — same machine as backend
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1'
  }
  // Android emulator — localhost maps to 10.0.2.2
  if (Platform.OS === 'android') {
    return `http://${LOCAL_IP}:8000/api/v1`
  }
  // iOS simulator or physical device (Expo Go)
  return `http://${LOCAL_IP}:8000/api/v1`
}

const getWsUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'ws://localhost:8000/api/v1/ws/sessions'
  }
  return `ws://${LOCAL_IP}:8000/api/v1/ws/sessions`
}

export const API_URL = getBaseUrl()
export const WS_URL  = getWsUrl()