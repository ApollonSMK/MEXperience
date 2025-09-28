import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the `@supabase/ssr` package. It exchanges an auth code for the user's session.
  const { searchParams } = new URL(request.url);
  const siteUrl = 'https://6000-firebase-studio-1758837619142.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev';
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${siteUrl}/login?message=Could not authenticate user`);
}
