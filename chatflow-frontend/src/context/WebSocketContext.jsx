import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { getWebSocketUrl } from "../api"
import { useAuth } from "./AuthContext"

const WSContext = createContext(null)

export function WSProvider({ children }) {
  const { user }          = useAuth()
  const wsRef             = useRef(null)
  const [ready, setReady] = useState(false)
  const listenersRef      = useRef([])      // array of callback functions
  const reconnectTimer    = useRef(null)    // holds reconnect timeout id

  const connect = useCallback(() => {
    // FIX 1: read token from localStorage and pass it as query param
    const token = localStorage.getItem("token")

    // if no user or no token, don't attempt connection
    if (!user || !token) return

    const ws = new WebSocket(`${getWebSocketUrl(user.id)}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("✅ WebSocket connected")
      setReady(true)
      // FIX 2: clear any pending reconnect timer on successful connect
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    ws.onclose = (e) => {
      console.log("🔌 WebSocket closed:", e.code, e.reason)
      setReady(false)

      // FIX 3: auto-reconnect after 3s, but NOT on auth failure (code 1008)
      if (e.code !== 1008 && user) {
        reconnectTimer.current = setTimeout(() => {
          console.log("🔄 Reconnecting WebSocket...")
          connect()
        }, 3000)
      }
    }

    // FIX 4: handle connection errors explicitly
    ws.onerror = (e) => {
      console.error("🔥 WebSocket error:", e)
      setReady(false)
    }

    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        // notify all listeners
        listenersRef.current.forEach((cb) => cb(payload))
      } catch (_) {
        console.warn("⚠️ Failed to parse WebSocket message:", e.data)
      }
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    connect()

    // cleanup: close socket and cancel any pending reconnect on unmount/user change
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setReady(false)
    }
  }, [user, connect])

  // send a JSON payload through WebSocket
  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      // FIX 5: warn instead of silently dropping the message
      console.warn("⚠️ WebSocket not open — message dropped:", data)
    }
  }, [])

  // subscribe to incoming messages — returns unsubscribe fn
  const subscribe = useCallback((cb) => {
    listenersRef.current.push(cb)
    return () => {
      listenersRef.current = listenersRef.current.filter((fn) => fn !== cb)
    }
  }, [])

  return (
    <WSContext.Provider value={{ send, subscribe, ready }}>
      {children}
    </WSContext.Provider>
  )
}

export const useWS = () => useContext(WSContext)