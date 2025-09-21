/**
 * 🎯 Unified Customer Form Hook
 *
 * Clean, einheitlicher Hook für Customer-Formulare.
 * Verwendet die neuen Services und korrekten Types.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Customer,
  CustomerFormData,
  CUSTOMER_STATUS_VALUES,
} from '@/lib/shared-types';
// NO SERVICE IMPORT - API only!

// CustomerFormData ist jetzt aus shared-types.ts importiert - Single Source of Truth!

const defaultFormData: CustomerFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  street: '',
  city: '',
  postal_code: '',
  country: 'Deutschland',
  industry: '',
  status: 'prospect',
  notes: '',
  tags: [] // ✅ Now correctly typed as string[]
};

interface UseCustomerFormReturn {
  formData: CustomerFormData
  isSubmitting: boolean
  error: string | null

  // Actions
  setFormData: (data: CustomerFormData) => void
  updateField: <K extends keyof CustomerFormData>(field: K, value: CustomerFormData[K]) => void // ✅ Generic for type safety
  resetForm: () => void
  loadCustomer: (customer: Customer) => void
  submitForm: (customer?: Customer) => Promise<boolean>

  // Validation
  isValid: boolean
  fieldErrors: Partial<Record<keyof CustomerFormData, string>>
}

export function useCustomerForm(onSuccess?: () => void): UseCustomerFormReturn {
  const [formData, setFormData] = useState<CustomerFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({})

  const updateField = <K extends keyof CustomerFormData>(field: K, value: CustomerFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const rest: Partial<Record<keyof CustomerFormData, string>> = { ...prev }
        delete rest[field]
        return rest
      })
    }
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setError(null)
    setFieldErrors({})
  }

  const loadCustomer = useCallback((customer: Customer) => {
    setFormData({
      // Map database fields to form fields (DB Schema is Single Source of Truth)
      name: customer.contact_person || '',
      company: customer.company_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      website: customer.website || '',
      street: customer.address_line1 || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      country: customer.country || 'Deutschland',
      industry: customer.industry || '',
      status: customer.status || 'prospect',
      notes: customer.notes || '',
      tags: customer.tags || [] // ✅ Correct: Database has string[], Form has string[]
    })
    setError(null)
    setFieldErrors({})
  }, [])

  // Validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CustomerFormData, string>> = {}

    // Required fields
    if (!formData.name.trim() && !formData.company.trim()) {
      errors.name = 'Name oder Unternehmen ist erforderlich'
      errors.company = 'Name oder Unternehmen ist erforderlich'
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ungültige E-Mail-Adresse'
    }

    // Status validation
    if (!CUSTOMER_STATUS_VALUES.includes(formData.status)) {
      errors.status = 'Ungültiger Status'
    }

    // ✅ annual_revenue removed - doesn't exist in DB schema

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Compute isValid without side effects
  const isValid = (() => {
    // Required fields
    if (!formData.name.trim() && !formData.company.trim()) {
      return false
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return false
    }

    // Status validation
    if (!CUSTOMER_STATUS_VALUES.includes(formData.status)) {
      return false
    }

    // ✅ annual_revenue removed - doesn't exist in DB schema

    return true
  })()

  const submitForm = async (customer?: Customer): Promise<boolean> => {
    if (!validateForm()) {
      setError('Bitte korrigieren Sie die Eingabefehler')
      return false
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare data for the service (DB Schema is Single Source of Truth)
      // Send client-friendly payload; server will map to DB schema
      const customerData = {
        name: formData.name.trim() || formData.company.trim(),
        company: formData.company.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        street: formData.street.trim() || null,
        city: formData.city.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        country: formData.country.trim() || null,
        industry: formData.industry.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        tags: formData.tags.length > 0 ? formData.tags : null
      }

      // Use API route instead of service
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
      const method = customer ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })

      if (response.ok) {
        onSuccess?.()
        return true
      } else {
        const error = await response.json()
        setError(error.error || 'Fehler beim Speichern des Kunden')
        return false
      }
    } catch (err) {
      console.error('Failed to save customer:', err)
      setError('Unerwarteter Fehler beim Speichern')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    isSubmitting,
    error,
    setFormData,
    updateField,
    resetForm,
    loadCustomer,
    submitForm,
    isValid,
    fieldErrors
  }
}
