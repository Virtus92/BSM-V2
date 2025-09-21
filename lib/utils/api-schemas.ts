/**
 * 🎯 Type-Safe API Request Schemas
 *
 * Replaces untyped request.json() parsing with proper validation schemas.
 * Ensures API layer has same type safety as Service layer.
 */

import { NextRequest } from 'next/server'
import { createValidator } from './validation'
import { logValidationError, logApiError } from './error-handler'
import {
  CustomerStatus,
  PriorityLevel,
  ContactRequestStatus,
  CUSTOMER_STATUS_VALUES,
  PRIORITY_VALUES,
  CONTACT_REQUEST_STATUS_VALUES
} from '@/lib/shared-types'

// === Base Types ===
export interface ApiValidationResult<T> {
  success: boolean
  data?: T
  errors?: Record<string, string>
  message?: string
}

// === Customer API Schemas ===
export interface CustomerCreateRequest {
  name?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  street?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  industry?: string | null
  status?: CustomerStatus | null
  priority?: PriorityLevel | null
  source?: string | null
  notes?: string | null
  tags?: string[] | null
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  id: string
}

// === Contact Request API Schemas ===
export interface ContactRequestCreateRequest {
  name: string
  email: string
  company?: string | null
  phone?: string | null
  subject: string
  message: string
  source?: string | null
  status?: ContactRequestStatus | null
  priority?: PriorityLevel | null
}

export interface ContactRequestUpdateRequest {
  status?: ContactRequestStatus | null
  priority?: PriorityLevel | null
  assigned_to?: string | null
  note?: string | null
}

// === Type Guards ===
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// === Schema Validators ===
export class ApiSchemaValidator {
  /**
   * Parse and validate JSON request body
   */
  async parseRequestBody(request: NextRequest): Promise<ApiValidationResult<Record<string, unknown>>> {
    try {
      const body = await request.json()
      if (!isRecord(body)) {
        return {
          success: false,
          message: 'Request body must be a valid object'
        }
      }
      return { success: true, data: body }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logApiError('parseRequestBody', err, { metadata: { url: request.url } })
      return {
        success: false,
        message: 'Invalid JSON in request body'
      }
    }
  }

  /**
   * Validate customer creation request
   */
  validateCustomerCreate(data: Record<string, unknown>): ApiValidationResult<CustomerCreateRequest> {
    const name = typeof data.name === 'string' ? data.name : undefined
    const company = typeof data.company === 'string' ? data.company : undefined
    const email = typeof data.email === 'string' ? data.email : undefined
    const phone = typeof data.phone === 'string' ? data.phone : undefined
    const website = typeof data.website === 'string' ? data.website : undefined
    const street = typeof data.street === 'string' ? data.street : undefined
    const city = typeof data.city === 'string' ? data.city : undefined
    const postal_code = typeof data.postal_code === 'string' ? data.postal_code : undefined
    const country = typeof data.country === 'string' ? data.country : undefined
    const industry = typeof data.industry === 'string' ? data.industry : undefined
    const status = typeof data.status === 'string' ? (data.status as CustomerStatus) : undefined
    const priority = typeof data.priority === 'string' ? (data.priority as PriorityLevel) : undefined
    const source = typeof data.source === 'string' ? data.source : undefined
    const notes = typeof data.notes === 'string' ? data.notes : undefined
    const tags = data.tags

    const validator = createValidator()
      .custom(name || company, (value) => {
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          return 'Either name or company is required'
        }
        return null
      }, 'name_or_company')

    if (name) {
      validator.length(name, 1, 255, 'name')
    }

    if (company) {
      validator.length(company, 1, 255, 'company')
    }

    if (email) {
      validator.email(email, 'email')
    }

    if (phone) {
      validator.phone(phone, 'phone')
    }

    if (website) {
      validator.url(website, 'website')
    }

    if (status) {
      validator.enum(status, CUSTOMER_STATUS_VALUES, 'status')
    }

    if (priority) {
      validator.enum(priority, PRIORITY_VALUES, 'priority')
    }

    // Validate string fields length
    const stringFields = ['street', 'city', 'postal_code', 'country', 'industry', 'source', 'notes']
    stringFields.forEach(field => {
      const v = data[field as keyof typeof data]
      if (typeof v === 'string') {
        validator.length(v, 1, 500, field)
      }
    })

    // Validate tags array
    if (tags !== undefined && !Array.isArray(tags)) {
      logValidationError('tags', 'Must be an array', { metadata: { hasTags: true } })
      return {
        success: false,
        errors: { tags: 'Tags must be an array' }
      }
    }

    const result = validator.build()
    if (!result.isValid) {
      return {
        success: false,
        errors: result.errors
      }
    }

    // Build clean data object
    const cleanData: CustomerCreateRequest = {
      name: name?.trim() || company?.trim(),
      company: company?.trim() || null,
      email: email?.trim()?.toLowerCase() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      street: street?.trim() || null,
      city: city?.trim() || null,
      postal_code: postal_code?.trim() || null,
      country: country?.trim() || null,
      industry: industry?.trim() || null,
      status: status || 'prospect',
      priority: priority || 'medium',
      source: source?.trim() || null,
      notes: notes?.trim() || null,
      tags: Array.isArray(tags) && tags.length > 0 ? (tags as string[]) : null
    }

    return {
      success: true,
      data: cleanData
    }
  }

  /**
   * Validate customer update request
   */
  validateCustomerUpdate(data: Record<string, unknown>, customerId: string): ApiValidationResult<CustomerUpdateRequest> {
    const createValidation = this.validateCustomerCreate(data)
    if (!createValidation.success) {
      return { success: false, errors: createValidation.errors, message: createValidation.message }
    }

    return {
      success: true,
      data: {
        id: customerId,
        ...createValidation.data
      }
    }
  }

  /**
   * Validate contact request creation
   */
  validateContactRequestCreate(data: Record<string, unknown>): ApiValidationResult<ContactRequestCreateRequest> {
    const name = typeof data.name === 'string' ? data.name : ''
    const email = typeof data.email === 'string' ? data.email : ''
    const company = typeof data.company === 'string' ? data.company : undefined
    const phone = typeof data.phone === 'string' ? data.phone : undefined
    const subject = typeof data.subject === 'string' ? data.subject : ''
    const message = typeof data.message === 'string' ? data.message : ''
    const source = typeof data.source === 'string' ? data.source : undefined
    const status = typeof data.status === 'string' ? (data.status as ContactRequestStatus) : undefined
    const priority = typeof data.priority === 'string' ? (data.priority as PriorityLevel) : undefined

    const validator = createValidator()
      .required(name, 'name')
      .required(email, 'email')
      .required(subject, 'subject')
      .required(message, 'message')
      .email(email, 'email')
      .length(name, 1, 255, 'name')
      .length(subject, 1, 255, 'subject')
      .length(message, 10, 5000, 'message')

    if (company) {
      validator.length(company, 1, 255, 'company')
    }

    if (phone) {
      validator.phone(phone, 'phone')
    }

    if (status) {
      validator.enum(status, CONTACT_REQUEST_STATUS_VALUES, 'status')
    }

    if (priority) {
      validator.enum(priority, PRIORITY_VALUES, 'priority')
    }

    const result = validator.build()
    if (!result.isValid) {
      return {
        success: false,
        errors: result.errors
      }
    }

    const cleanData: ContactRequestCreateRequest = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      source: source?.trim() || 'website',
      status: status || 'new',
      priority: priority || 'medium'
    }

    return {
      success: true,
      data: cleanData
    }
  }

  /**
   * Validate contact request update
   */
  validateContactRequestUpdate(data: Record<string, unknown>): ApiValidationResult<ContactRequestUpdateRequest> {
    const status = typeof data.status === 'string' ? (data.status as ContactRequestStatus) : undefined
    const priority = typeof data.priority === 'string' ? (data.priority as PriorityLevel) : undefined
    const assigned_to = (typeof data.assigned_to === 'string' || data.assigned_to === null) ? data.assigned_to : undefined
    const note = typeof data.note === 'string' ? data.note : undefined

    const validator = createValidator()

    if (status) {
      validator.enum(status, CONTACT_REQUEST_STATUS_VALUES, 'status')
    }

    if (priority) {
      validator.enum(priority, PRIORITY_VALUES, 'priority')
    }

    if (note) {
      validator.length(note, 1, 1000, 'note')
    }

    const result = validator.build()
    if (!result.isValid) {
      return {
        success: false,
        errors: result.errors
      }
    }

    const cleanData: ContactRequestUpdateRequest = {}
    if (status) cleanData.status = status
    if (priority) cleanData.priority = priority
    if (assigned_to !== undefined) cleanData.assigned_to = assigned_to as string | null
    if (note) cleanData.note = note.trim()

    return {
      success: true,
      data: cleanData
    }
  }
}

// Singleton instance
export const apiValidator = new ApiSchemaValidator()

// Convenience functions
export const parseAndValidateCustomerCreate = async (request: NextRequest): Promise<ApiValidationResult<CustomerCreateRequest>> => {
  const parseResult = await apiValidator.parseRequestBody(request)
  if (!parseResult.success) {
    return {
      success: false,
      message: parseResult.message,
      errors: parseResult.errors
    }
  }

  if (!parseResult.data) {
    return {
      success: false,
      message: 'Missing request data'
    }
  }

  return apiValidator.validateCustomerCreate(parseResult.data)
}

export const parseAndValidateCustomerUpdate = async (request: NextRequest, customerId: string): Promise<ApiValidationResult<CustomerUpdateRequest>> => {
  const parseResult = await apiValidator.parseRequestBody(request)
  if (!parseResult.success) {
    return {
      success: false,
      message: parseResult.message,
      errors: parseResult.errors
    }
  }

  if (!parseResult.data) {
    return {
      success: false,
      message: 'Missing request data'
    }
  }

  return apiValidator.validateCustomerUpdate(parseResult.data, customerId)
}

export const parseAndValidateContactRequestCreate = async (request: NextRequest): Promise<ApiValidationResult<ContactRequestCreateRequest>> => {
  const parseResult = await apiValidator.parseRequestBody(request)
  if (!parseResult.success) {
    return {
      success: false,
      message: parseResult.message,
      errors: parseResult.errors
    }
  }

  if (!parseResult.data) {
    return {
      success: false,
      message: 'Missing request data'
    }
  }

  return apiValidator.validateContactRequestCreate(parseResult.data)
}

export const parseAndValidateContactRequestUpdate = async (request: NextRequest): Promise<ApiValidationResult<ContactRequestUpdateRequest>> => {
  const parseResult = await apiValidator.parseRequestBody(request)
  if (!parseResult.success) {
    return {
      success: false,
      message: parseResult.message,
      errors: parseResult.errors
    }
  }

  if (!parseResult.data) {
    return {
      success: false,
      message: 'Missing request data'
    }
  }

  return apiValidator.validateContactRequestUpdate(parseResult.data)
}
