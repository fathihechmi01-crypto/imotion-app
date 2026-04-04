import { useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import { WS_URL } from '@/constants/api'

interface WSEvent {
  event: 'booked' | 'cancelled' | 'checked_in' | 'ping'
  seance_id?: number
  utilisateur_id?: number
  timestamp: string
}

export function useWebSocket(token: string | null, onEvent: (e: WSEvent) => void) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    if (!token) return
    ws.current = new WebSocket(`${WS_URL}?token=${token}`)

    ws.current.onopen = () => console.log('[WS] Connected')

    ws.current.onmessage = (e) => {
      try {
        const data: WSEvent = JSON.parse(e.data)
        if (data.event !== 'ping') onEvent(data)
      } catch {}
    }

    ws.current.onclose = () => {
      // Auto-reconnect after 5s
      reconnectTimer.current = setTimeout(connect, 5000)
    }

    ws.current.onerror = () => ws.current?.close()
  }, [token, onEvent])

  useEffect(() => {
    // WebSocket supported everywhere including web
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])
}
