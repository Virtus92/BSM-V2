/**
 * Role-Based Authentication Middleware
 * Comprehensive role-based access control and route protection
 * Rising BSM V2: Enterprise Authentication & Authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type UserRole = 'admin' | 'employee' | 'customer';

export interface AuthResult {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    requiresActivation: boolean;
  } | null;
  error?: string;
  redirectTo?: string;
}

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  requiresSetup?: boolean;
  description: string;
}

// ============================================================================
// ROUTE PERMISSIONS CONFIGURATION
// ============================================================================

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Public routes (no authentication required)
  { path: '/auth', allowedRoles: ['admin', 'employee', 'customer'], description: 'Authentication pages' },
  { path: '/setup', allowedRoles: ['admin', 'employee', 'customer'], requiresSetup: false, description: 'System setup' },

  // Admin-only routes
  { path: '/dashboard/admin', allowedRoles: ['admin'], description: 'Admin dashboard and settings' },
  { path: '/dashboard/users', allowedRoles: ['admin'], description: 'User management' },
  { path: '/dashboard/security', allowedRoles: ['admin'], description: 'Security settings and logs' },
  { path: '/dashboard/system', allowedRoles: ['admin'], description: 'System configuration' },

  // Employee workspace (admins and employees)
  { path: '/workspace', allowedRoles: ['admin', 'employee'], description: 'Employee workspace for customer management' },

  // Main dashboard (admin only)
  { path: '/dashboard', allowedRoles: ['admin'], description: 'Admin dashboard' },

  // Customer portal routes
  { path: '/portal', allowedRoles: ['customer'], description: 'Customer portal' },
  { path: '/portal/profile', allowedRoles: ['customer'], description: 'Customer profile management' },
  { path: '/portal/requests', allowedRoles: ['customer'], description: 'Customer request history' },
  { path: '/portal/documents', allowedRoles: ['customer'], description: 'Customer documents' },
  { path: '/customer-setup', allowedRoles: ['customer'], description: 'Customer profile setup' },

  // API routes
  { path: '/api/admin', allowedRoles: ['admin'], description: 'Admin API endpoints' },
  { path: '/api/customers', allowedRoles: ['admin', 'employee'], description: 'Customer management API' },
  { path: '/api/contact', allowedRoles: ['admin', 'employee'], description: 'Contact request API' },
  { path: '/api/portal', allowedRoles: ['customer'], description: 'Customer portal API' },
];

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Authenticate user and get their role
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authenticated: false,
        user: null,
        error: 'No valid session',
        redirectTo: '/auth/login'
      };
    }

    // Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, is_active, activation_required, activated_at')
      .eq('id', user.id)
      .single();

    console.log('Middleware - User profile query:', {
      userId: user.id,
      email: user.email,
      profile,
      profileError: profileError?.message,
      hasProfile: !!profile,
      isActive: profile?.is_active
    });

    if (profileError || !profile) {
      console.log('Middleware - No profile found or error, setting inactive:', {
        hasError: !!profileError,
        errorMessage: profileError?.message,
        hasProfile: !!profile
      });
      // User exists but no profile - might be during setup
      return {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email!,
          role: 'customer', // Default role
          isActive: false,
          requiresActivation: true
        }
      };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email!,
        role: profile.user_type as UserRole,
        isActive: profile.is_active,
        requiresActivation: profile.activation_required && !profile.activated_at
      }
    };

  } catch (error) {
    return {
      authenticated: false,
      user: null,
      error: 'Authentication error',
      redirectTo: '/auth/login'
    };
  }
}

/**
 * Check if system setup is required
 */
export async function checkSystemSetup(): Promise<{
  isInstalled: boolean;
  requiresSetup: boolean;
}> {
  try {
    const supabase = await createClient();

    const { data: config } = await supabase
      .from('system_config')
      .select('is_installed, first_admin_id')
      .single();

    return {
      isInstalled: config?.is_installed || false,
      requiresSetup: !config?.is_installed
    };

  } catch (error) {
    // If we can't check setup status, assume setup is required
    return {
      isInstalled: false,
      requiresSetup: true
    };
  }
}

/**
 * Check route permissions for user
 */
export function checkRoutePermission(
  path: string,
  userRole: UserRole | null,
  isSystemSetup: boolean = true
): {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
} {
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/sign-up', '/auth/forgot-password'];

  if (publicRoutes.some(route => path.startsWith(route))) {
    return { allowed: true };
  }

  // Setup route - special handling
  if (path.startsWith('/setup')) {
    if (isSystemSetup) {
      return {
        allowed: false,
        reason: 'System already setup',
        redirectTo: '/auth/login'
      };
    }
    return { allowed: true };
  }

  // All other routes require authentication
  if (!userRole) {
    return {
      allowed: false,
      reason: 'Authentication required',
      redirectTo: '/auth/login'
    };
  }

  // If system setup is not complete, redirect to setup (except admins)
  if (!isSystemSetup && userRole !== 'admin') {
    return {
      allowed: false,
      reason: 'System setup required',
      redirectTo: '/setup'
    };
  }

  // Find matching route permission
  const routePermission = ROUTE_PERMISSIONS.find(route =>
    path.startsWith(route.path)
  );

  if (!routePermission) {
    // Default: allow authenticated users access to unlisted routes
    return { allowed: true };
  }

  // Check if user role is allowed
  if (!routePermission.allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Access denied for role: ${userRole}`,
      redirectTo: getRoleBasedRedirect(userRole)
    };
  }

  return { allowed: true };
}

/**
 * Get default redirect based on user role
 */
export function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'employee':
      return '/workspace';
    case 'customer':
      return '/portal';
    default:
      return '/auth/login';
  }
}

/**
 * Role-based authentication middleware
 */
export async function withRoleAuth(request: NextRequest): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname;

  console.log('Middleware - checking path:', path);

  // Skip authentication for static files and API routes handled elsewhere
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.includes('.')
  ) {
    return null;
  }

  try {
    // Check system setup status
    const { isInstalled, requiresSetup } = await checkSystemSetup();

    // Authenticate user
    const authResult = await authenticateUser(request);

    // Check route permissions
    const permissionResult = checkRoutePermission(
      path,
      authResult.user?.role || null,
      isInstalled
    );

    if (!permissionResult.allowed) {
      console.log('Middleware - access denied for path:', path, 'user role:', authResult.user?.role, 'redirecting to:', permissionResult.redirectTo);

      const redirectUrl = new URL(
        permissionResult.redirectTo || '/auth/login',
        request.url
      );

      // Add return URL for login redirects
      if (permissionResult.redirectTo === '/auth/login') {
        redirectUrl.searchParams.set('redirectTo', path);
      }

      return NextResponse.redirect(redirectUrl);
    } else {
      console.log('Middleware - access allowed for path:', path, 'user role:', authResult.user?.role);
    }

    // Check if user requires activation
    if (
      authResult.authenticated &&
      authResult.user?.requiresActivation &&
      !path.startsWith('/auth/activation') &&
      !path.startsWith('/setup')
    ) {
      console.log('Middleware - User requires activation, redirecting to activation');
      return NextResponse.redirect(new URL('/auth/activation', request.url));
    }

    // Check if user is inactive
    if (
      authResult.authenticated &&
      authResult.user &&
      !authResult.user.isActive &&
      !path.startsWith('/auth/login') &&
      !path.startsWith('/auth/error')
    ) {
      console.log('Middleware - User is inactive, redirecting to login with error');
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('error', 'account_inactive');
      return NextResponse.redirect(redirectUrl);
    }

    // Add user context to headers for downstream use
    if (authResult.authenticated && authResult.user) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', authResult.user.id);
      response.headers.set('x-user-role', authResult.user.role);
      response.headers.set('x-user-email', authResult.user.email);
      return response;
    }

    return null; // Continue to next middleware

  } catch (error) {
    console.error('Role auth middleware error:', error);

    // Fail securely - redirect to login on errors
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if route requires specific role
 */
export function requiresRole(path: string, role: UserRole): boolean {
  const routePermission = ROUTE_PERMISSIONS.find(route =>
    path.startsWith(route.path)
  );

  return routePermission?.allowedRoles.includes(role) || false;
}

/**
 * Get all routes accessible by role
 */
export function getRoutesForRole(role: UserRole): RoutePermission[] {
  return ROUTE_PERMISSIONS.filter(route =>
    route.allowedRoles.includes(role)
  );
}

/**
 * Check if user has permission for specific action
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'assign' | 'approve'
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, is_active')
      .eq('id', userId)
      .single();

    if (!profile?.is_active) {
      return false;
    }

    // Check role permissions
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select(`can_${action}`)
      .eq('role', profile.user_type)
      .eq('resource', resource)
      .single();

    return permissions?.[`can_${action}`] || false;

  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Activity logging for authentication events
 */
export async function logAuthActivity(
  userId: string | null,
  action: 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'SETUP_COMPLETE',
  details: Record<string, any> = {},
  request?: NextRequest
): Promise<void> {
  try {
    const supabase = await createClient();

    const clientIP = request?.headers.get('x-forwarded-for') ||
                    request?.headers.get('x-real-ip') ||
                    'unknown';

    await supabase.from('user_activity_logs').insert({
      user_id: userId,
      action,
      resource_type: 'authentication',
      ip_address: clientIP,
      user_agent: request?.headers.get('user-agent'),
      request_path: request?.nextUrl.pathname,
      request_method: request?.method,
      additional_context: details,
      severity: action === 'ACCESS_DENIED' ? 'medium' : 'low'
    });

  } catch (error) {
    console.error('Failed to log auth activity:', error);
    // Don't throw - logging failures shouldn't break authentication
  }
}