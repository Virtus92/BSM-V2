import { updateSession } from "@/lib/supabase/middleware";
import { withSecurity } from "@/lib/middleware/security";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const securityResponse = await withSecurity(request);
  if (securityResponse) return securityResponse;
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Protect only the dashboard section
    "/dashboard",
    "/dashboard/:path*",
  ],
};
