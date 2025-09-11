// API Base Configuration for TITO HR Management System

import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API Base URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Always check for real JWT token first (from actual login)
    const realToken = localStorage.getItem('accessToken');
    
    if (realToken && config.headers) {
      // Use real JWT token if available (from actual login)
      config.headers.Authorization = `Bearer ${realToken}`;
    } else if (import.meta.env.DEV) {
      // Fallback to development tokens only if no real token is available
      const currentPath = window.location.pathname;
      let devToken = 'test-token';
      
      // Determine department based on current path
      if (currentPath.includes('/dept/')) {
        // For department head routes, use a default department token
        // This can be customized by setting a localStorage value
        const departmentType = localStorage.getItem('devDepartmentType') || 'it';
        devToken = `dept-head-token-${departmentType}`;
      } else if (currentPath.includes('/hr/')) {
        devToken = 'test-token'; // HR admin token
      } else if (currentPath.includes('/employee/')) {
        devToken = 'employee-token';
      }
      
      if (config.headers) {
        config.headers.Authorization = devToken;
      }
    }
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
    // Handle 401 errors (unauthorized) - redirect to login
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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
  details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: any
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
  get: <T>(url: string, config?: any): Promise<T> =>
    api.get(url, config).then(response => response.data),
  
  post: <T>(url: string, data?: any, config?: any): Promise<T> =>
    api.post(url, data, config).then(response => response.data),
  
  put: <T>(url: string, data?: any, config?: any): Promise<T> =>
    api.put(url, data, config).then(response => response.data),
  
  patch: <T>(url: string, data?: any, config?: any): Promise<T> =>
    api.patch(url, data, config).then(response => response.data),
  
  delete: <T>(url: string, config?: any): Promise<T> =>
    api.delete(url, config).then(response => response.data),
};

// File upload helper
export const uploadFile = async (url: string, file: File, onProgress?: (progress: number) => void): Promise<any> => {
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