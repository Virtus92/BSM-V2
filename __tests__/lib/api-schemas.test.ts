import { describe, it, expect } from '@jest/globals'
import {
  ApiSchemaValidator,
  parseAndValidateCustomerCreate,
  parseAndValidateCustomerUpdate,
  parseAndValidateContactRequestCreate,
  parseAndValidateContactRequestUpdate,
} from '@/lib/utils/api-schemas'
import { NextRequest } from 'next/server'

const makeRequest = (url: string, body: unknown): NextRequest => {
  return new NextRequest(url, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('api-schemas', () => {
  it('validateCustomerCreate succeeds with valid minimal data', () => {
    const v = new ApiSchemaValidator()
    const res = v.validateCustomerCreate({ name: ' Alice ', email: ' ALICE@EXAMPLE.com ' })
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
      status: 'prospect',
      priority: 'medium',
    })
  })

  it('validateCustomerCreate fails when neither name nor company present', () => {
    const v = new ApiSchemaValidator()
    const res = v.validateCustomerCreate({ email: 'x@example.com' })
    expect(res.success).toBe(false)
    expect(res.errors).toHaveProperty('name_or_company')
  })

  it('validateCustomerCreate fails when tags is not an array', () => {
    const v = new ApiSchemaValidator()
    const res = v.validateCustomerCreate({ name: 'Bob', tags: 'not-array' })
    expect(res.success).toBe(false)
    expect(res.errors).toEqual({ tags: 'Tags must be an array' })
  })

  it('validateCustomerUpdate adds id and reuses create validation', () => {
    const v = new ApiSchemaValidator()
    const res = v.validateCustomerUpdate({ name: 'Charlie' }, 'cust_123')
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({ id: 'cust_123', name: 'Charlie' })
  })

  it('validateContactRequestCreate enforces required fields and formats', () => {
    const v = new ApiSchemaValidator()
    const bad = v.validateContactRequestCreate({})
    expect(bad.success).toBe(false)
    // Should include multiple required errors
    expect(Object.keys(bad.errors || {})).toEqual(
      expect.arrayContaining(['name', 'email', 'subject', 'message'])
    )

    const good = v.validateContactRequestCreate({
      name: 'Dave',
      email: 'dave@example.com',
      subject: 'Hi',
      message: 'I would like to know more.',
    })
    expect(good.success).toBe(true)
    expect(good.data).toMatchObject({
      name: 'Dave',
      email: 'dave@example.com',
      source: 'website',
      status: 'new',
      priority: 'medium',
    })
  })

  it('validateContactRequestUpdate handles optional fields and enums', () => {
    const v = new ApiSchemaValidator()
    const bad = v.validateContactRequestUpdate({ status: 'nope' })
    expect(bad.success).toBe(false)
    expect(bad.errors).toHaveProperty('status')

    const good = v.validateContactRequestUpdate({
      status: 'responded',
      priority: 'high',
      assigned_to: null,
      note: 'Updated',
    })
    expect(good.success).toBe(true)
    expect(good.data).toEqual({
      status: 'responded',
      priority: 'high',
      assigned_to: null,
      note: 'Updated',
    })
  })

  it('parseAndValidateCustomerCreate handles invalid JSON', async () => {
    const req = makeRequest('http://localhost/api/customers', 'not-json')
    const res = await parseAndValidateCustomerCreate(req)
    expect(res.success).toBe(false)
    expect(res.message).toBe('Invalid JSON in request body')
  })

  it('parseAndValidateCustomerUpdate passes customerId through', async () => {
    const req = makeRequest('http://localhost/api/customers/xyz', { name: 'Zed' })
    const res = await parseAndValidateCustomerUpdate(req, 'xyz')
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({ id: 'xyz', name: 'Zed' })
  })

  it('parseAndValidateContactRequestCreate validates body', async () => {
    const req = makeRequest('http://localhost/api/contact', {
      name: 'Eve',
      email: 'eve@example.com',
      subject: 'Ping',
      message: 'Please contact me.',
    })
    const res = await parseAndValidateContactRequestCreate(req)
    expect(res.success).toBe(true)
  })

  it('parseAndValidateContactRequestUpdate validates optional updates', async () => {
    const req = makeRequest('http://localhost/api/contact/123', { status: 'converted' })
    const res = await parseAndValidateContactRequestUpdate(req)
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({ status: 'converted' })
  })
})

