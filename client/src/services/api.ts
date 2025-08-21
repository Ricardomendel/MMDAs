import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const sameOriginBase = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || sameOriginBase,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          toast.error('Session expired. Please login again.');
          break;
          
        case 403:
          // Forbidden
          toast.error(data?.message || 'Access denied');
          break;
          
        case 404:
          // Not found
          toast.error(data?.message || 'Resource not found');
          break;
          
        case 409:
          // Conflict
          toast.error(data?.message || 'Resource conflict');
          break;
          
        case 422:
          // Validation error
          if (data?.errors) {
            const errorMessages = data.errors.map((err: any) => err.msg).join(', ');
            toast.error(errorMessages);
          } else {
            toast.error(data?.message || 'Validation failed');
          }
          break;
          
        case 429:
          // Rate limit
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Other errors
          toast.error(data?.message || 'An error occurred');
          break;
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
    
  register: (userData: any) =>
    api.post('/auth/register', userData),
    
  logout: () =>
    api.post('/auth/logout'),
    
  getProfile: () =>
    api.get('/auth/profile'),
    
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
    
  resetPassword: (data: { token: string; new_password: string }) =>
    api.post('/auth/reset-password', data),
    
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
};

export const revenueAPI = {
  getAssessments: (params?: any) =>
    api.get('/revenue/assessments', { params }),
    
  getAssessment: (id: string) =>
    api.get(`/revenue/assessments/${id}`),
    
  createAssessment: (data: any) =>
    api.post('/revenue/assessments', data),
    
  updateAssessment: (id: string, data: any) =>
    api.put(`/revenue/assessments/${id}`, data),
    
  deleteAssessment: (id: string) =>
    api.delete(`/revenue/assessments/${id}`),
    
  getProperties: (params?: any) =>
    api.get('/revenue/properties', { params }),
    
  getProperty: (id: string) =>
    api.get(`/revenue/properties/${id}`),
    
  createProperty: (data: any) =>
    api.post('/revenue/properties', data),
    
  updateProperty: (id: string, data: any) =>
    api.put(`/revenue/properties/${id}`, data),
    
  deleteProperty: (id: string) =>
    api.delete(`/revenue/properties/${id}`),
    
  getRevenueCategories: (params?: any) =>
    api.get('/revenue/categories', { params }),
    
  getRevenueCategory: (id: string) =>
    api.get(`/revenue/categories/${id}`),
};

// Payment API methods
export const paymentAPI = {
  getPayments: () => api.get('/payments'),
  getPayment: (id: string) => api.get(`/payments/${id}`),
  createPayment: (data: any) => api.post('/payments', data),
  checkPaymentStatus: (id: string) => api.get(`/payments/${id}/status`),
  cancelPayment: (id: string) => api.post(`/payments/${id}/cancel`),
  getPaymentMethods: () => api.get('/payments/methods/available'),
};

export const userAPI = {
  getUsers: (params?: any) =>
    api.get('/users', { params }),
    
  getUser: (id: string) =>
    api.get(`/users/${id}`),
    
  createUser: (data: any) =>
    api.post('/users', data),
    
  updateUser: (id: string, data: any) =>
    api.put(`/users/${id}`, data),
    
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
    
  updateProfile: (data: any) =>
    api.put('/users/profile', data),
    
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/users/change-password', data),
};

export const reportAPI = {
  getDashboardStats: (params?: any) =>
    api.get('/reports/dashboard', { params }),
    
  getRevenueReport: (params?: any) =>
    api.get('/reports/revenue', { params }),
    
  getPaymentReport: (params?: any) =>
    api.get('/reports/payments', { params }),
    
  getAssessmentReport: (params?: any) =>
    api.get('/reports/assessments', { params }),
    
  getPropertyReport: (params?: any) =>
    api.get('/reports/properties', { params }),
    
  exportReport: (type: string, params?: any) =>
    api.get(`/reports/export/${type}`, { 
      params,
      responseType: 'blob'
    }),
};

export const notificationAPI = {
  getNotifications: (params?: any) =>
    api.get('/notifications', { params }),
    
  getNotification: (id: string) =>
    api.get(`/notifications/${id}`),
    
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
    
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
    
  deleteNotification: (id: string) =>
    api.delete(`/notifications/${id}`),
    
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
};

export const adminAPI = {
  getSystemStats: () =>
    api.get('/admin/stats'),
    
  // Staff dashboard
  getStaffDashboard: () =>
    api.get('/auth/staff/dashboard'),
    
  // User management
  getUsers: () =>
    api.get('/admin/users'),
    
  // Staff-specific user management (only taxpayers)
  getUsersForStaff: () =>
    api.get('/admin/users/staff'),
    
  getUser: (id: string) =>
    api.get(`/admin/users/${id}`),
    
  createUser: (data: any) =>
    api.post('/admin/users', data),
    
  updateUser: (id: string, data: any) =>
    api.put(`/admin/users/${id}`, data),
    
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
    
  // Revenue management
  getRevenueCategories: () =>
    api.get('/admin/revenue-categories'),
    
  createRevenueCategory: (data: any) =>
    api.post('/admin/revenue-categories', data),
    
  // Property management
  getProperties: (params?: any) =>
    api.get('/admin/properties', { params }),
    
  // Activities and notifications
  getRecentActivities: () =>
    api.get('/admin/activities'),
    
  // Staff-specific activities (only taxpayer-related)
  getRecentActivitiesForStaff: () =>
    api.get('/admin/activities/staff'),
    
  sendAuthorizationEmail: (data: any) =>
    api.post('/admin/send-authorization-email', data),
    
  // Bulk operations
  bulkUserOperations: (data: any) =>
    api.post('/admin/bulk-user-operations', data),
    
  getMMDAs: (params?: any) =>
    api.get('/admin/mmdas', { params }),
    
  getMMDA: (id: string) =>
    api.get(`/admin/mmdas/${id}`),
    
  createMMDA: (data: any) =>
    api.post('/admin/mmdas', data),
    
  updateMMDA: (id: string, data: any) =>
    api.put(`/admin/mmdas/${id}`, data),
    
  deleteMMDA: (id: string) =>
    api.delete(`/admin/mmdas/${id}`),
    
  getSystemSettings: () =>
    api.get('/admin/settings'),
    
  updateSystemSettings: (data: any) =>
    api.put('/admin/settings', data),
    
  getAuditLogs: (params?: any) =>
    api.get('/admin/audit-logs', { params }),
};

export { api };
