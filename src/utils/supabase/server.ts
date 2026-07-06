import { createClient as createSupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Extend the SupabaseClientOptions type to include our custom cookie handling
interface CustomSupabaseClientOptions extends SupabaseClientOptions<'public'> {
  cookies?: {
    get: (name: string) => string | null;
    set: (name: string, value: string, options: any) => void;
    remove: (name: string, options: any) => void;
  };
}

export const createClient = () => {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  // Try to extract token values from the auth cookie if it exists
  let accessToken = null;
  let refreshToken = null;

  const authTokenCookie = cookieStore.get('sb-auth-token');
  if (authTokenCookie) {
    try {
      // The cookie contains a JSON string with access and refresh tokens
      const authData = JSON.parse(authTokenCookie.value);
      accessToken = authData.access_token;
      refreshToken = authData.refresh_token;
    } catch (e) {
      console.error('Failed to parse auth token cookie');
    }
  }

  // Create the Supabase client with enhanced cookie handling
  // @ts-ignore - Using custom cookie handling which TypeScript doesn't fully support
  return createSupabaseClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'sb-auth-token',
        // If we have tokens, use them directly to avoid parsing issues
        ...(accessToken && refreshToken ? {
          flowType: 'pkce',
          initialSession: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 3600, // Default expiry
            expires_at: Math.floor(Date.now() / 1000) + 3600, // Default expiry
            token_type: 'bearer',
            user: null // Will be populated on first request
          }
        } : {})
      },
      cookies: {
        get(name: string) {
          // Special handling for token cookies
          if (name === 'sb-access-token' && accessToken) {
            return accessToken;
          }

          if (name === 'sb-refresh-token' && refreshToken) {
            return refreshToken;
          }

          // Standard cookie handling for other cookies
          const cookie = cookieStore.get(name);

          if (!cookie) {
            // Check for sb-auth-token JSON cookie which might contain our tokens
            if (name.includes('token') && authTokenCookie) {
              try {
                const authData = JSON.parse(authTokenCookie.value);

                // Match the request to the appropriate token in the JSON
                if (name === 'sb-access-token' || name.includes('access')) {
                  return authData.access_token;
                }

                if (name === 'sb-refresh-token' || name.includes('refresh')) {
                  return authData.refresh_token;
                }

                return null;
              } catch {
                // Parsing failed, continue with normal flow
              }
            }

            return null;
          }

          return cookie.value;
        },
        set(name: string, value: string, options: any) {
          // Cookies can only be set client-side; server context ignores this
        },
        remove(name: string, options: any) {
          // Cookies can only be removed client-side; server context ignores this
        }
      },
    } as CustomSupabaseClientOptions
  );
};

/**
 * Create a Supabase admin client with service role permissions
 * Use this for operations that need to bypass RLS policies
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createSupabaseClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
} 