import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Failed to parse stored user:', err)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      
      if (response && response.token && response.user) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        
        console.log('✅ Login successful, user set:', response.user.email)
        return { success: true, user: response.user }
      } else {
        console.error('❌ Invalid response structure:', response)
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Login error:', error)
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
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        
        console.log('✅ Registration successful, user set:', response.user.email)
        return { success: true, user: response.user }
      } else {
        console.error('❌ Invalid response structure:', response)
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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
