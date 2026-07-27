import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
        
        // ✅ Redirect to dashboard after successful login
        navigate('/dashboard')
        return { success: true }
      } else {
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
        
        // ✅ Redirect to dashboard after successful registration
        navigate('/dashboard')
        return { success: true }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Register error:', error)
      return { 
        success: false, 
        error: error?.message || error?.error || 'Registration failed. Please try again.' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
