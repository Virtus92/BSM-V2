import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { withSecurity } from '@/lib/middleware/security'
import { NextRequest } from 'next/server'

// --- Supabase server mock ---
const authGetUserMock = jest.fn()
const fromInsertMock = jest.fn().mockResolvedValue({})
const fromMock = jest.fn(() => ({ insert: fromInsertMock }))
const createClientMock = jest.fn(async () => ({
  auth: { getUser: authGetUserMock },
  from: fromMock,
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

const makeReq = (url: string, init?: RequestInit & { headers?: Record<string, string> }) => {
  const headers = new Headers(init?.headers || {})
  return new NextRequest(url, {
    method: init?.method || 'GET',
    body: init?.body as any,
    headers,
  })
}

describe('EnterpriseSecurityMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('blocks non-whitelisted IPs when whitelist is enforced', async () => {
    const req = makeReq('http://localhost/api/organizations/list', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    })

    const res = await withSecurity(req, {
      accessControl: {
        enforceIPWhitelist: true,
        allowedIPs: ['127.0.0.1'],
        requireMFA: false,
        sessionTimeout: 1000,
      },
      rateLimiting: { enabled: false, windowMs: 1000, maxRequests: 1, skipSuccessfulRequests: false },
      threatDetection: { enabled: false, suspiciousPatterns: [], ipBlacklist: [], maxFailedAttempts: 1, lockoutDuration: 1000 },
      auditLogging: { enabled: false, sensitiveEndpoints: [], logLevel: 'basic' },
    })

    expect(res).not.toBeNull()
    expect(res?.status).toBe(403)
  })

  it('rate limits repeated requests from same IP and path', async () => {
    const req1 = makeReq('http://localhost/api/ping', { headers: { 'x-forwarded-for': '1.2.3.4' } })
    const req2 = makeReq('http://localhost/api/ping', { headers: { 'x-forwarded-for': '1.2.3.4' } })

    const cfg = {
      accessControl: { enforceIPWhitelist: false, allowedIPs: [], requireMFA: false, sessionTimeout: 1000 },
      rateLimiting: { enabled: true, windowMs: 60_000, maxRequests: 1, skipSuccessfulRequests: false },
      threatDetection: { enabled: false, suspiciousPatterns: [], ipBlacklist: [], maxFailedAttempts: 1, lockoutDuration: 1000 },
      auditLogging: { enabled: false, sensitiveEndpoints: [], logLevel: 'basic' },
    } as const

    const res1 = await withSecurity(req1, cfg)
    expect(res1).toBeNull()

    const res2 = await withSecurity(req2, cfg)
    expect(res2).not.toBeNull()
    expect(res2?.status).toBe(429)
  })

  it('detects threats and blocks based on configuration', async () => {
    const req = makeReq('http://localhost/api/ping', {
      method: 'POST',
      body: 'drop table users',
      headers: { 'x-forwarded-for': '9.9.9.9' },
    })

    const res = await withSecurity(req, {
      accessControl: { enforceIPWhitelist: false, allowedIPs: [], requireMFA: false, sessionTimeout: 1000 },
      rateLimiting: { enabled: false, windowMs: 1000, maxRequests: 100, skipSuccessfulRequests: false },
      threatDetection: { enabled: true, suspiciousPatterns: ['drop table'], ipBlacklist: [], maxFailedAttempts: 1, lockoutDuration: 1000 },
      auditLogging: { enabled: false, sensitiveEndpoints: [], logLevel: 'basic' },
    })

    expect(res).not.toBeNull()
    expect(res?.status).toBe(403)
  })

  it('requires valid session on protected routes', async () => {
    authGetUserMock.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no session' } })
    const req = makeReq('http://localhost/api/organizations/list')

    const res = await withSecurity(req, {
      accessControl: { enforceIPWhitelist: false, allowedIPs: [], requireMFA: false, sessionTimeout: 1000 },
      rateLimiting: { enabled: false, windowMs: 1000, maxRequests: 100, skipSuccessfulRequests: false },
      threatDetection: { enabled: false, suspiciousPatterns: [], ipBlacklist: [], maxFailedAttempts: 1, lockoutDuration: 1000 },
      auditLogging: { enabled: false, sensitiveEndpoints: [], logLevel: 'basic' },
    })

    expect(res).not.toBeNull()
    expect(res?.status).toBe(401)
  })

  it('allows protected route when session is valid', async () => {
    authGetUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    const req = makeReq('http://localhost/api/organizations/data')

    const res = await withSecurity(req, {
      accessControl: { enforceIPWhitelist: false, allowedIPs: [], requireMFA: false, sessionTimeout: 1000 },
      rateLimiting: { enabled: false, windowMs: 1000, maxRequests: 100, skipSuccessfulRequests: false },
      threatDetection: { enabled: false, suspiciousPatterns: [], ipBlacklist: [], maxFailedAttempts: 1, lockoutDuration: 1000 },
      auditLogging: { enabled: false, sensitiveEndpoints: [], logLevel: 'basic' },
    })

    expect(res).toBeNull()
  })
})

