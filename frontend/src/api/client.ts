import axios from 'axios';

const isDev = import.meta.env.DEV;
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Normalize API_BASE_URL: ensure it points to the backend /api/v1 endpoint
const getBaseUrl = (): string => {
  if (rawBaseUrl && !rawBaseUrl.includes('localhost')) {
    const trimmed = rawBaseUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/api/v1')) return trimmed;
    if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
    return `${trimmed}/api/v1`;
  }
  if (rawBaseUrl && isDev) {
    const trimmed = rawBaseUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/api/v1')) return trimmed;
    if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
    return `${trimmed}/api/v1`;
  }
  return isDev
    ? 'http://localhost:5001/api/v1'
    : 'https://employee-leave-management-approval-portal.onrender.com/api/v1';
};

const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('elap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login failure attempts
      if (!window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('elap_token');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);
