import { ApiResponse, ApiSuccess, ApiError, isApiSuccess } from './api-response';

// Client-side API utilities for handling standardized responses
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: 'Failed to connect to server',
          details: error,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Default client instance
export const apiClient = new ApiClient();

// React hook for handling API responses
export interface UseApiResponse<T> {
  data: T | null;
  error: ApiError['error'] | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  meta?: ApiSuccess<T>['meta'];
}

// Utility functions for handling API responses
export function handleApiResponse<T>(
  response: ApiResponse<T>
): { data: T | null; error: string | null } {
  if (isApiSuccess(response)) {
    return { data: response.data, error: null };
  } else {
    return { data: null, error: response.error.message };
  }
}

export function extractErrorMessage(response: ApiResponse): string {
  if (isApiSuccess(response)) {
    return '';
  }
  return response.error.message;
}

export function extractSuccessMessage<T>(response: ApiResponse<T>): string {
  if (isApiSuccess(response)) {
    return response.message || '';
  }
  return '';
}

// Type-safe API endpoints
export const ApiEndpoints = {
  // Contact endpoints
  contact: {
    list: '/api/contact',
    create: '/api/contact',
    convert: (id: string) => `/api/contact/${id}/convert`,
  },

  // Task endpoints
  tasks: {
    list: '/api/tasks',
    create: '/api/tasks',
    get: (id: string) => `/api/tasks/${id}`,
    update: (id: string) => `/api/tasks/${id}`,
    delete: (id: string) => `/api/tasks/${id}`,
  },

  // User endpoints
  users: {
    list: '/api/users',
    create: '/api/users',
    get: (id: string) => `/api/users/${id}`,
    update: (id: string) => `/api/users/${id}`,
    assign: (id: string) => `/api/users/${id}/assign`,
  },

  // Activity endpoints
  activity: {
    list: '/api/activity',
    create: '/api/activity',
  },

  // Admin endpoints
  admin: {
    users: '/api/admin/users',
    system: '/api/admin/system',
  },

  // Debug endpoints (development only)
  debug: {
    users: '/api/debug/users-data',
    userStatus: '/api/debug/user-status',
    testRls: '/api/debug/test-rls',
    dbUsers: '/api/debug/db-users',
    middleware: '/api/debug/middleware-logic',
  },
} as const;

// Response type definitions for common endpoints
export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  progress_percentage?: number;
  estimated_hours?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to?: string;
}

export interface User {
  id: string;
  email: string;
  user_type: 'admin' | 'employee' | 'customer';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

// API response type helpers
export type ContactListResponse = ApiResponse<{ requests: ContactRequest[] }>;
export type ContactCreateResponse = ApiResponse<{ id: string }>;
export type TaskListResponse = ApiResponse<{ tasks: Task[] }>;
export type TaskCreateResponse = ApiResponse<{ id: string }>;
export type UserListResponse = ApiResponse<{ users: User[] }>;
export type UserCreateResponse = ApiResponse<{ id: string }>;