import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, fetchCsrfToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        await fetchCsrfToken();
        const res = await api.getCurrentUser();
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  async function login(email, password) {
    setError(null);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      await fetchCsrfToken();
      return res.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // Ignored
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
