/**
 * Database type definitions
 * Centralized type definitions for all database entities
 */

export type UserType = 'admin' | 'employee' | 'customer';

export type CustomerStatus = 'prospect' | 'active' | 'inactive' | 'pending';

export type RequestStatus = 'new' | 'in_progress' | 'completed' | 'responded' | 'closed';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'completed' | 'pending';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// User Profile
export interface UserProfile {
  id: string;
  user_type: UserType;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Customer
export interface Customer {
  id: string;
  user_id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  industry: string | null;
  status: CustomerStatus;
  tags: string[] | null;
  assigned_employee_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Customer with relations
export interface CustomerWithRelations extends Customer {
  user_profiles?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>;
  assigned_employee?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>;
}

// Contact Request
export interface ContactRequest {
  id: string;
  customer_id: string | null;
  customer_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  message: string;
  status: RequestStatus;
  priority: Priority;
  urgency: Priority;
  assigned_to: string | null;
  converted_to_customer_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Contact Request with relations
export interface ContactRequestWithRelations extends ContactRequest {
  converted_customer?: Pick<Customer, 'id' | 'company_name' | 'contact_person'>;
  assigned_user?: Pick<UserProfile, 'id' | 'first_name' | 'last_name'>;
}

// Task
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Task with relations
export interface TaskWithRelations extends Task {
  assigned_user?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>;
  creator?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>;
}

// Customer Note
export interface CustomerNote {
  id: string;
  customer_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Customer Note with relations
export interface CustomerNoteWithRelations extends CustomerNote {
  creator?: Pick<UserProfile, 'id' | 'first_name' | 'last_name'>;
}

// Chat Message
export interface ChatMessage {
  id: string;
  customer_id: string;
  sender_id: string;
  message: string;
  is_from_customer: boolean;
  created_at: string;
}

// Chat Message with relations
export interface ChatMessageWithRelations extends ChatMessage {
  user_profiles?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>;
  sender?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>;
}

// Statistics interfaces
export interface RequestStats {
  total: number;
  new: number;
  in_progress: number;
  completed: number;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form data types (for creating/updating)
export interface CreateCustomerData {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  industry?: string;
  status?: CustomerStatus;
  tags?: string[];
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: string;
}

export interface CreateContactRequestData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  priority?: Priority;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigned_to?: string;
  due_date?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
}
