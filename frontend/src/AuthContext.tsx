import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id:    number;
  name:  string;
  email: string;
}

interface AuthContextType {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (token: string, user: User) => void;
  logout:          () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on first load
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('taskflow_token');
      const savedUser  = localStorage.getItem('taskflow_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // api.ts dispatches this event instead of window.location.href on 401.
  // Handling it here keeps logout inside React state — no hard reload.
  useEffect(() => {
    const handleForceLogout = () => {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      setToken(null);
      setUser(null);
      // PrivateRoute auto-redirects to /login when isAuthenticated → false
    };
    window.addEventListener('taskflow:logout', handleForceLogout);
    return () => window.removeEventListener('taskflow:logout', handleForceLogout);
  }, []);

  const login = (newToken: string, newUser: User): void => {
    localStorage.setItem('taskflow_token', newToken);
    localStorage.setItem('taskflow_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    // PublicRoute auto-redirects to / when isAuthenticated → true
  };

  const logout = (): void => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token,
      isLoading, login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);