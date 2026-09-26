import axios from 'axios';

const isDev = import.meta.env.DEV;
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

// In production, fallback to same-domain relative /api/v1 even if localhost was accidentally passed in Vercel
const API_BASE_URL =
  !isDev && (!rawBaseUrl || rawBaseUrl.includes('localhost'))
    ? '/api/v1'
    : (rawBaseUrl || (isDev ? 'http://localhost:5001/api/v1' : '/api/v1'));

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
