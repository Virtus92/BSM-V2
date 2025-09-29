import { updateSession } from "@/lib/supabase/middleware";
import { withSecurity } from "@/lib/middleware/security";
import { withRoleAuth } from "@/lib/middleware/auth";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Security middleware (rate limiting, threat detection)
  const securityResponse = await withSecurity(request);
  if (securityResponse) return securityResponse;

  // 2. Session management
  const sessionResponse = await updateSession(request);
  if (sessionResponse) return sessionResponse;

  // 3. Role-based authentication and authorization
  const authResponse = await withRoleAuth(request);
  if (authResponse) return authResponse;

  // Continue to route handler
  return null;
}

export const config = {
  matcher: [
    // Protect authenticated routes
    "/dashboard/:path*",
    "/workspace/:path*",
    "/portal/:path*",
    "/customer-setup",
    "/setup/:path*",
    "/api/admin/:path*",
    "/api/customers/:path*",
    "/api/contact/:path*",
    "/api/portal/:path*",
    "/api/customer-setup",
    // Include auth routes for redirect handling
    "/auth/:path*",
  ],
};
