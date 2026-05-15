import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

// Full-screen spinner shown while localStorage is being read
const SplashScreen = () => (
  <div style={{
    height: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', flexDirection: 'column', gap: 16
  }}>
    <div style={{
      background: 'var(--accent)', borderRadius: 12,
      padding: 12, display: 'flex'
    }}>
      {/* Layers icon inline so no import needed */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    </div>
    <span style={{ color: 'var(--text2)', fontSize: 14 }}>Loading TaskFlow…</span>
    <span className="spinner" />
  </div>
);

// Waits for auth check before deciding where to send the user
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;                    // ← wait
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;                    // ← wait
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
    <Route path="/" element={
      <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
    } />
    <Route path="/projects" element={
      <PrivateRoute><Layout><ProjectsPage /></Layout></PrivateRoute>
    } />
    <Route path="/projects/:id" element={
      <PrivateRoute><Layout><ProjectDetailPage /></Layout></PrivateRoute>
    } />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg3)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
