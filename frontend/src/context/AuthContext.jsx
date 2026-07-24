import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('ms_user')
    return u ? JSON.parse(u) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem('ms_token', data.token)
    localStorage.setItem('ms_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (form) => {
    const data = await api.post('/auth/register', form)
    localStorage.setItem('ms_token', data.token)
    localStorage.setItem('ms_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('ms_token')
    localStorage.removeItem('ms_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
