/**
 * Zod validation schemas for forms and API endpoints
 */

import { z } from 'zod';

// User schemas
export const userTypeSchema = z.enum(['admin', 'employee', 'customer']);

export const createUserSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  user_type: userTypeSchema,
});

export const updateUserProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
});

// Customer schemas
export const customerStatusSchema = z.enum(['prospect', 'active', 'inactive', 'pending']);

export const createCustomerSchema = z.object({
  company_name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  contact_person: z.string().max(200).optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  website: z.string().url('Ungültige URL').optional().or(z.literal('')),
  address_line1: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  status: customerStatusSchema.optional().default('prospect'),
  tags: z.array(z.string()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().uuid('Ungültige Kunden-ID'),
});

export const assignEmployeeSchema = z.object({
  customer_id: z.string().uuid('Ungültige Kunden-ID'),
  employee_id: z.string().uuid('Ungültige Mitarbeiter-ID'),
});

// Contact Request schemas
export const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const requestStatusSchema = z.enum(['new', 'in_progress', 'completed', 'responded', 'closed']);

export const createContactRequestSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  subject: z.string().min(1, 'Betreff ist erforderlich').max(500),
  message: z.string().min(1, 'Nachricht ist erforderlich'),
  priority: prioritySchema.optional().default('medium'),
});

export const updateContactRequestSchema = z.object({
  id: z.string().uuid('Ungültige Anfrage-ID'),
  status: requestStatusSchema.optional(),
  assigned_to: z.string().uuid('Ungültige Mitarbeiter-ID').optional(),
  priority: prioritySchema.optional(),
});

export const convertRequestToCustomerSchema = z.object({
  request_id: z.string().uuid('Ungültige Anfrage-ID'),
  company_name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  status: customerStatusSchema.optional().default('prospect'),
});

// Task schemas
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'done', 'completed', 'pending']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(500),
  description: z.string().optional(),
  status: taskStatusSchema.optional().default('todo'),
  priority: prioritySchema.optional().default('medium'),
  assigned_to: z.string().uuid('Ungültige Mitarbeiter-ID').optional(),
  due_date: z.string().datetime('Ungültiges Datum').optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid('Ungültige Aufgaben-ID'),
});

export const taskCommentSchema = z.object({
  task_id: z.string().uuid('Ungültige Aufgaben-ID'),
  content: z.string().min(1, 'Kommentar darf nicht leer sein'),
});

// Customer Note schemas
export const createCustomerNoteSchema = z.object({
  customer_id: z.string().uuid('Ungültige Kunden-ID'),
  content: z.string().min(1, 'Notiz darf nicht leer sein'),
});

export const updateCustomerNoteSchema = z.object({
  id: z.string().uuid('Ungültige Notiz-ID'),
  content: z.string().min(1, 'Notiz darf nicht leer sein'),
});

// Chat Message schemas
export const createChatMessageSchema = z.object({
  customer_id: z.string().uuid('Ungültige Kunden-ID'),
  message: z.string().min(1, 'Nachricht darf nicht leer sein'),
});

// Portal Request schemas (from customer portal)
export const portalRequestSchema = z.object({
  subject: z.string().min(1, 'Betreff ist erforderlich').max(500),
  message: z.string().min(1, 'Nachricht ist erforderlich'),
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

export const signUpSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  confirmPassword: z.string(),
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const userFilterSchema = z.object({
  user_type: userTypeSchema.optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const customerFilterSchema = z.object({
  status: customerStatusSchema.optional(),
  assigned_employee_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const requestFilterSchema = z.object({
  status: requestStatusSchema.optional(),
  priority: prioritySchema.optional(),
  assigned_to: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  assigned_to: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateContactRequestInput = z.infer<typeof createContactRequestSchema>;
export type UpdateContactRequestInput = z.infer<typeof updateContactRequestSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type PortalRequestInput = z.infer<typeof portalRequestSchema>;
