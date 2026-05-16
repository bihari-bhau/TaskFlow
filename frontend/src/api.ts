import axios from 'axios';

// Allow runtime override via `window.__REACT_APP_API_URL` injected by the container
const runtimeBase = (window as any).__REACT_APP_API_URL;
const BASE_URL = runtimeBase || process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT to every outgoing request ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle 401 globally ───────────────────────────────────────────────────────
//
// DO NOT use window.location.href — it causes a hard page reload which
// destroys all React state and creates an infinite redirect loop.
//
// Instead: dispatch a custom DOM event. AuthContext listens to it,
// calls logout() which updates React state, and PrivateRoute
// automatically redirects to /login with no reload needed.
//
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Skip auth routes — a 401 on /auth/login just means wrong password,
      // it should NOT log the user out or redirect anywhere.
      const url: string = error.config?.url ?? '';
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/signup');

      if (!isAuthRoute) {
        // Soft logout — AuthContext handles state cleanup
        window.dispatchEvent(new CustomEvent('taskflow:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;