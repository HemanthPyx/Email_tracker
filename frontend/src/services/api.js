/**
 * API client for communicating with the Django backend.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        
        const res = await axios.post(`${API_BASE}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = res.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ── Auth endpoints ──
export const authAPI = {
  getGoogleAuthUrl: (redirectUri) =>
    api.get('/auth/google/url/', { params: { redirect_uri: redirectUri } }),
  
  googleCallback: (code, redirectUri, codeVerifier) =>
    api.post('/auth/google/callback/', { code, redirect_uri: redirectUri, code_verifier: codeVerifier }),
  
  getCurrentUser: () => api.get('/auth/me/'),
  
  connectEmail: (code, redirectUri, codeVerifier) =>
    api.post('/auth/connect-email/', { code, redirect_uri: redirectUri, code_verifier: codeVerifier }),
};

// ── Email Account endpoints ──
export const emailAccountAPI = {
  list: () => api.get('/auth/email-accounts/'),
  get: (id) => api.get(`/auth/email-accounts/${id}/`),
  update: (id, data) => api.patch(`/auth/email-accounts/${id}/`, data),
  disconnect: (id) => api.delete(`/auth/email-accounts/${id}/`),
};

// ── Registration endpoints ──
export const registrationAPI = {
  list: (params = {}) => api.get('/registrations/', { params }),
  get: (id) => api.get(`/registrations/${id}/`),
  verify: (id) => api.post(`/registrations/${id}/verify/`),
  dismiss: (id) => api.post(`/registrations/${id}/dismiss/`),
  search: (query, params = {}) =>
    api.get('/registrations/', { params: { search: query, ...params } }),
};

// ── Dashboard endpoints ──
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/'),
};

// ── Scan endpoints ──
export const scanAPI = {
  trigger: (emailAccountId = null) =>
    api.post('/scan/', { email_account_id: emailAccountId }),
  
  logs: (params = {}) => api.get('/scan-logs/', { params }),
};

export default api;
