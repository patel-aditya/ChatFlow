import { createContext, useContext, useState, useEffect } from "react"
import { getMe, loginUser, registerUser } from "../api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // on mount — check if token exists and fetch user
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (loginValue, password) => {
    const data = await loginUser(loginValue, password)
    localStorage.setItem("token", data.access_token)
    const me = await getMe()
    setUser(me)
    return me
  }

  const register = async (username, email, password) => {
    await registerUser({ username, email, password })
    return login(email, password)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
