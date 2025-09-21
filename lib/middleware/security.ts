/**
 * Enterprise Security Middleware
 * Comprehensive security layer for API protection and threat detection
 * Rising BSM V2: Enterprise Security Implementation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean
    windowMs: number
    maxRequests: number
    skipSuccessfulRequests: boolean
  }
  threatDetection: {
    enabled: boolean
    suspiciousPatterns: string[]
    ipBlacklist: string[]
    maxFailedAttempts: number
    lockoutDuration: number
  }
  auditLogging: {
    enabled: boolean
    sensitiveEndpoints: string[]
    logLevel: 'basic' | 'detailed' | 'complete'
  }
  accessControl: {
    enforceIPWhitelist: boolean
    allowedIPs: string[]
    requireMFA: boolean
    sessionTimeout: number
  }
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // per IP per window
    skipSuccessfulRequests: false
  },
  threatDetection: {
    enabled: true,
    suspiciousPatterns: [
      'union select', 'drop table', 'insert into', 'delete from',
      '<script', 'javascript:', 'eval(', 'document.cookie',
      '../../../', '/etc/passwd', 'cmd.exe', 'powershell'
    ],
    ipBlacklist: [],
    maxFailedAttempts: 5,
    lockoutDuration: 30 * 60 * 1000 // 30 minutes
  },
  auditLogging: {
    enabled: true,
    sensitiveEndpoints: [
      '/api/organizations/', '/api/users/',
      '/api/security/', '/api/admin/'
    ],
    logLevel: 'detailed'
  },
  accessControl: {
    enforceIPWhitelist: false,
    allowedIPs: [],
    requireMFA: false,
    sessionTimeout: 8 * 60 * 60 * 1000 // 8 hours
  }
}

// ============================================================================
// SECURITY MIDDLEWARE CLASS
// ============================================================================

export class EnterpriseSecurityMiddleware {
  private config: SecurityConfig
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map()
  private threatStore: Map<string, { attempts: number; lastAttempt: number }> = new Map()

  constructor(config?: Partial<SecurityConfig>) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config }

    // Cleanup old entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries()
    }, 5 * 60 * 1000)
  }

  /**
   * Main security middleware function
   */
  async protect(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now()
    const clientIP = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = request.nextUrl.pathname

    try {
      // 1. IP Whitelist Check
      if (this.config.accessControl.enforceIPWhitelist) {
        const ipCheckResult = await this.checkIPWhitelist(clientIP)
        if (!ipCheckResult.allowed) {
          await this.logSecurityEvent('IP_BLOCKED', {
            ip: clientIP,
            path,
            reason: 'IP not in whitelist'
          })
          return new NextResponse('Access denied', { status: 403 })
        }
      }

      // 2. Rate Limiting
      if (this.config.rateLimiting.enabled) {
        const rateLimitResult = await this.checkRateLimit(clientIP, path)
        if (!rateLimitResult.allowed) {
          await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
            ip: clientIP,
            path,
            attempts: rateLimitResult.attempts,
            resetTime: rateLimitResult.resetTime
          })
          return new NextResponse('Rate limit exceeded', {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
            }
          })
        }
      }

      // 3. Threat Detection
      if (this.config.threatDetection.enabled) {
        const threatResult = await this.detectThreats(request, clientIP)
        if (threatResult.isThreat) {
          await this.logSecurityEvent('THREAT_DETECTED', {
            ip: clientIP,
            path,
            threats: threatResult.threats,
            userAgent,
            requestBody: threatResult.requestAnalysis
          })

          // Block if too many threat attempts
          if (threatResult.shouldBlock) {
            return new NextResponse('Security violation detected', { status: 403 })
          }
        }
      }

      // 4. Session Validation for Protected Routes
      if (this.isProtectedRoute(path)) {
        const sessionResult = await this.validateSession(request)
        if (!sessionResult.valid) {
          await this.logSecurityEvent('INVALID_SESSION', {
            ip: clientIP,
            path,
            reason: sessionResult.reason,
            userAgent
          })
          return new NextResponse('Authentication required', { status: 401 })
        }
      }

      // 5. Audit Logging for Sensitive Endpoints
      if (this.shouldAuditLog(path)) {
        await this.auditLog(request, clientIP, {
          processingTime: Date.now() - startTime,
          status: 'allowed'
        })
      }

      return null // Continue to next middleware/handler

    } catch (error) {
      await this.logSecurityEvent('MIDDLEWARE_ERROR', {
        ip: clientIP,
        path,
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent
      })

      // Fail securely - block on errors
      return new NextResponse('Security check failed', { status: 500 })
    }
  }

  /**
   * Rate limiting implementation
   */
  private async checkRateLimit(clientIP: string, path: string): Promise<{
    allowed: boolean
    attempts: number
    resetTime?: number
  }> {
    const key = `${clientIP}:${path}`
    const now = Date.now()
    const windowMs = this.config.rateLimiting.windowMs
    const maxRequests = this.config.rateLimiting.maxRequests

    let entry = this.rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      // New window
      entry = { count: 1, resetTime: now + windowMs }
      this.rateLimitStore.set(key, entry)
      return { allowed: true, attempts: 1, resetTime: entry.resetTime }
    }

    entry.count++

    if (entry.count > maxRequests) {
      return {
        allowed: false,
        attempts: entry.count,
        resetTime: entry.resetTime
      }
    }

    return {
      allowed: true,
      attempts: entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * Threat detection system
   */
  private async detectThreats(request: NextRequest, clientIP: string): Promise<{
    isThreat: boolean
    threats: string[]
    shouldBlock: boolean
    requestAnalysis?: { url: string; method: string; userAgent: string; hasBody: boolean; bodySize: number }
  }> {
    const threats: string[] = []
    const url = request.nextUrl.toString()
    const userAgent = request.headers.get('user-agent') || ''

    let requestBody = ''
    try {
      if (request.method === 'POST' || request.method === 'PUT') {
        const clonedRequest = request.clone()
        requestBody = await clonedRequest.text()
      }
    } catch {
      // Ignore body parsing errors
    }

    // Check suspicious patterns
    const suspiciousContent = `${url} ${userAgent} ${requestBody}`.toLowerCase()

    for (const pattern of this.config.threatDetection.suspiciousPatterns) {
      if (suspiciousContent.includes(pattern.toLowerCase())) {
        threats.push(pattern)
      }
    }

    // Check for IP in blacklist
    if (this.config.threatDetection.ipBlacklist.includes(clientIP)) {
      threats.push('IP_BLACKLISTED')
    }

    const isThreat = threats.length > 0

    // Track threat attempts for this IP
    let shouldBlock = false
    if (isThreat) {
      const threatKey = `threats:${clientIP}`
      let threatEntry = this.threatStore.get(threatKey)

      if (!threatEntry) {
        threatEntry = { attempts: 1, lastAttempt: Date.now() }
      } else {
        // Reset counter if last attempt was more than lockout duration ago
        if (Date.now() - threatEntry.lastAttempt > this.config.threatDetection.lockoutDuration) {
          threatEntry.attempts = 1
        } else {
          threatEntry.attempts++
        }
        threatEntry.lastAttempt = Date.now()
      }

      this.threatStore.set(threatKey, threatEntry)

      if (threatEntry.attempts >= this.config.threatDetection.maxFailedAttempts) {
        shouldBlock = true
      }
    }

    return {
      isThreat,
      threats,
      shouldBlock,
      requestAnalysis: {
        url,
        method: request.method,
        userAgent,
        hasBody: requestBody.length > 0,
        bodySize: requestBody.length
      }
    }
  }

  /**
   * Session validation
   */
  private async validateSession(request: NextRequest): Promise<{
    valid: boolean
    reason?: string
    userId?: string
  }> {
    try {
      const supabase = await createClient()

      // Get user from session
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return { valid: false, reason: 'No valid session' }
      }

      // Check session timeout (basic implementation)
      const lastActivity = request.headers.get('x-last-activity')
      if (lastActivity) {
        const lastActivityTime = new Date(lastActivity).getTime()
        if (Date.now() - lastActivityTime > this.config.accessControl.sessionTimeout) {
          return { valid: false, reason: 'Session expired' }
        }
      }

      return { valid: true, userId: user.id }

    } catch {
      return { valid: false, reason: 'Session validation error' }
    }
  }

  /**
   * IP whitelist check
   */
  private async checkIPWhitelist(clientIP: string): Promise<{ allowed: boolean }> {
    if (this.config.accessControl.allowedIPs.length === 0) {
      return { allowed: true } // No whitelist configured
    }

    // Check if IP is in whitelist (supports CIDR notation in production)
    const allowed = this.config.accessControl.allowedIPs.includes(clientIP)
    return { allowed }
  }

  /**
   * Audit logging
   */
  private async auditLog(
    request: NextRequest,
    clientIP: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = await createClient()

      const auditEntry = {
        event_type: 'api_access',
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent'),
        method: request.method,
        path: request.nextUrl.pathname,
        query_params: Object.fromEntries(request.nextUrl.searchParams),
        headers: this.config.auditLogging.logLevel === 'complete'
          ? Object.fromEntries(request.headers.entries())
          : {
              'content-type': request.headers.get('content-type'),
              'authorization': request.headers.get('authorization') ? '[REDACTED]' : null
            },
        metadata,
        timestamp: new Date().toISOString()
      }

      await supabase
        .from('security_audit_logs')
        .insert(auditEntry)

    } catch (error) {
      console.error('Failed to write audit log:', error)
      // Don't throw - audit logging failure shouldn't break the request
    }
  }

  /**
   * Security event logging
   */
  private async logSecurityEvent(
    eventType: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase
        .from('security_events')
        .insert({
          event_type: eventType,
          severity: this.getEventSeverity(eventType),
          details,
          timestamp: new Date().toISOString(),
          resolved: false
        })

    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Utility methods
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    if (realIP) {
      return realIP
    }

    // Fallback to connection remote address
    return 'unknown'
  }

  private isProtectedRoute(path: string): boolean {
    const protectedPaths = [
      '/api/organizations/', '/api/users/',
      '/api/admin/', '/api/security/'
    ]

    return protectedPaths.some(protectedPath => path.startsWith(protectedPath))
  }

  private shouldAuditLog(path: string): boolean {
    if (!this.config.auditLogging.enabled) return false

    return this.config.auditLogging.sensitiveEndpoints.some(endpoint =>
      path.startsWith(endpoint)
    )
  }

  private getEventSeverity(eventType: string): string {
    const severityMap: Record<string, string> = {
      'THREAT_DETECTED': 'high',
      'IP_BLOCKED': 'medium',
      'RATE_LIMIT_EXCEEDED': 'low',
      'INVALID_SESSION': 'low',
      'MIDDLEWARE_ERROR': 'high'
    }

    return severityMap[eventType] || 'medium'
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()

    // Clean up rate limit entries
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key)
      }
    }

    // Clean up threat entries
    for (const [key, entry] of this.threatStore.entries()) {
      if (now - entry.lastAttempt > this.config.threatDetection.lockoutDuration) {
        this.threatStore.delete(key)
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const enterpriseSecurity = new EnterpriseSecurityMiddleware()

// ============================================================================
// MIDDLEWARE WRAPPER FOR NEXT.JS
// ============================================================================

/**
 * Next.js middleware wrapper
 */
export async function withSecurity(
  request: NextRequest,
  config?: Partial<SecurityConfig>
): Promise<NextResponse | null> {
  const securityMiddleware = config
    ? new EnterpriseSecurityMiddleware(config)
    : enterpriseSecurity

  return await securityMiddleware.protect(request)
}
