// API Base Configuration for TITO HR Management System

import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
}

export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// API Base URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // Required to send HttpOnly cookies
});

  // Request interceptor for authentication
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // NOTE: JWT tokens are stored in HttpOnly cookies, so they are automatically sent
    // with requests via the httpOnly cookie mechanism. We don't need to manually add
    // Authorization headers as the browser handles this automatically for HttpOnly cookies.

    // No development tokens - rely on proper HttpOnly cookie authentication
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Prevent multiple simultaneous redirects
      const redirectKey = 'auth_redirect_pending';
      if (sessionStorage.getItem(redirectKey)) {
        return Promise.reject(error);
      }
      sessionStorage.setItem(redirectKey, 'true');

      // Check if we have a refresh token available (stored in HttpOnly cookie)
      const hasUserCookie = document.cookie.split(';').some(c => c.trim().startsWith('user='));

      if (hasUserCookie && !error.config._retry) {
        // Try to refresh the token
        try {
          error.config._retry = true;

          // Create a separate axios instance for refresh to avoid interceptor conflicts
          const refreshApi = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            withCredentials: true,
          });

          // Attempt to refresh the token via the refresh endpoint
          const refreshResponse = await refreshApi.post('/auth/refresh');

          if (refreshResponse.data.success) {
            // Token refreshed successfully, retry the original request
            sessionStorage.removeItem(redirectKey);
            return api.request(error.config);
          }
        } catch (refreshError) {
          // Token refresh failed, proceed to logout
          console.error('Token refresh failed:', refreshError);
        }
      }

      // Clear client-side auth data (user cookie is HttpOnly so we can't clear it)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        // Use replace to avoid adding to browser history and prevent refresh loops
        window.location.replace('/login');
      }

      // Clean up the redirect flag after a short delay
      setTimeout(() => {
        sessionStorage.removeItem(redirectKey);
      }, 1000);

      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response?.data?.error) {
      const apiError = new ApiError(
        error.response.data.error.code,
        error.response.data.error.message,
        error.response.status,
        error.response.data.error.details
      );
      return Promise.reject(apiError);
    }

    return Promise.reject(error);
  }
);

// API Error class
export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: ApiErrorDetails;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: ApiErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Generic API methods
export const apiMethods = {
  get: <T>(url: string, config?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    api.get(url, config).then(response => response.data),

  post: <T>(url: string, data?: Record<string, unknown>, config?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    api.post(url, data, config).then(response => response.data),

  put: <T>(url: string, data?: Record<string, unknown>, config?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then(response => response.data),

  patch: <T>(url: string, data?: Record<string, unknown>, config?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    api.patch(url, data, config).then(response => response.data),

  delete: <T>(url: string, config?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    api.delete(url, config).then(response => response.data),
};

// File upload helper
export const uploadFile = async <T>(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<T>> => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  }).then(response => response.data);
};

// Export API instance for direct use
export default api;