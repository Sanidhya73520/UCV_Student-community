import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore logout network errors
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    refreshUser: fetchCurrentUser,
    logout,
    isStudent: user?.role === 'student',
    isApprovedStudent: user?.role === 'student' && user?.status === 'approved',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
