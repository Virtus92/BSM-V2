import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Get user profile to determine correct redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_type, is_active')
          .eq('id', user.id)
          .single();

        if (!profile?.is_active) {
          redirect('/auth/error?error=Account is not active');
        }

        // Redirect based on user role
        switch (profile?.user_type) {
          case 'admin':
            redirect('/dashboard');
          case 'employee':
            redirect('/workspace');
          case 'customer':
            redirect('/portal');
          default:
            redirect('/portal'); // Default to portal
        }
      } else {
        redirect(next);
      }
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
