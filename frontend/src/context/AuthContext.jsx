import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ms_token');
    const savedUser = localStorage.getItem('ms_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem('ms_token');
        localStorage.removeItem('ms_user');
      }
    }
    setLoading(false);
  }, []);

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('ms_token', res.token);
    localStorage.setItem('ms_user', JSON.stringify(res.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${res.token}`;
    setUser(res.user);
    return res;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('ms_token', res.token);
    localStorage.setItem('ms_user', JSON.stringify(res.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${res.token}`;
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
