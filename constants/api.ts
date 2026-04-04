// Change this to your FastAPI server URL
export const API_URL = __DEV__
  ? 'http://localhost:8000/api/v1'
  : 'https://your-production-url.com/api/v1'

export const WS_URL = __DEV__
  ? 'ws://localhost:8000/api/v1/ws/sessions'
  : 'wss://your-production-url.com/api/v1/ws/sessions'