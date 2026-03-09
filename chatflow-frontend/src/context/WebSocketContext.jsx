import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { getWebSocketUrl } from "../api"
import { useAuth } from "./AuthContext"

const WSContext = createContext(null)

export function WSProvider({ children }) {
  const { user }     = useAuth()
  const wsRef        = useRef(null)
  const [ready, setReady] = useState(false)
  const listenersRef = useRef([])   // array of callback functions

  useEffect(() => {
    if (!user) return

    const ws = new WebSocket(getWebSocketUrl(user.id))
    wsRef.current = ws

    ws.onopen  = () => setReady(true)
    ws.onclose = () => setReady(false)

    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        // notify all listeners
        listenersRef.current.forEach((cb) => cb(payload))
      } catch (_) {}
    }

    return () => {
      ws.close()
      setReady(false)
    }
  }, [user])

  // send a JSON payload through WebSocket
  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
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
