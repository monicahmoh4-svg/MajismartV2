import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

function readStoredSession() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw), persistent: !!localStorage.getItem('token') };
  } catch (e) {
    return null;
  }
}

function writeSession(token, user, remember) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem('token', token);
  store.setItem('user', JSON.stringify(user));
  other.removeItem('token');
  other.removeItem('user');
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  try {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } catch (e) { /* private mode */ }
}

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load session (persistent or this-tab-only) on mount, then refresh
  // from the server so role, county, phone and KYC status never go stale.
  useEffect(() => {
    const session = readStoredSession()
    if (session) {
      setUser(session.user)
      api.get('/auth/me')
        .then((fresh) => {
          if (fresh && fresh.id) {
            setUser(fresh)
            writeSession(localStorage.getItem('token') || sessionStorage.getItem('token'), fresh, session.persistent)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password, remember = true) => {
    try {
      const response = await api.post('/auth/login', { email, password })

      if (response && response.token && response.user) {
        writeSession(response.token, response.user, remember)
        setUser(response.user)

        return { success: true, user: response.user }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      return {
        success: false,
        error: error?.message || error?.error || 'Login failed. Please check your credentials.'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      
      if (response && response.token && response.user) {
        writeSession(response.token, response.user, true)
        setUser(response.user)

        return { success: true, user: response.user }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      const msg = error?.message || ''
      // Timeout ambiguity recovery: the account may have been created
      // server-side even though the response never arrived (request retried
      // across backends, or a slow wake-up). If the server says the email
      // already exists, attempt login with the same credentials — success
      // proves the account is real and completes the signup seamlessly.
      if (/already registered|already exists/i.test(msg) && userData?.email && userData?.password) {
        const attempt = await login(userData.email, userData.password)
        if (attempt.success) return attempt
      }
      console.error('Register error:', error)
      return {
        success: false,
        error: msg || 'Registration failed. Please try again.'
      }
    }
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
