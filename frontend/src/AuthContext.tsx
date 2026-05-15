import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;          // ← NEW: true until localStorage is checked
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // ← start true

  useEffect(() => {
    // Read saved auth from localStorage on app start
    try {
      const savedToken = localStorage.getItem('taskflow_token');
      const savedUser  = localStorage.getItem('taskflow_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // Corrupted localStorage — clear it
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
    } finally {
      setIsLoading(false); // ← done checking, now render routes
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (user: User) => {
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token,
      isLoading,
      login, logout, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
