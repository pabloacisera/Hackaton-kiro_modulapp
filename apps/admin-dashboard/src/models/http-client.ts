import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// Token stored in memory — never in localStorage
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // sends refresh cookie automatically
});

// Request interceptor — attach access token
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Response interceptor — silent refresh on 401
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.set('Authorization', `Bearer ${token}`);
        return httpClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${API_BASE}/admin/auth/refresh`, {}, { withCredentials: true });
      const newToken: string = res.data.accessToken;
      setAccessToken(newToken);
      processQueue(null, newToken);
      original.headers.set('Authorization', `Bearer ${newToken}`);
      return httpClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      setAccessToken(null);
      onSessionExpired?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
