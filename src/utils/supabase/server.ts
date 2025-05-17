import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Get all cookies and log them (partially masked) for debugging
  const allCookies = cookieStore.getAll();
  
  // Specifically check for standard Supabase cookie patterns
  const supabaseCookies = allCookies.filter(c => 
    c.name.startsWith('sb-') || 
    c.name === 'sb-auth-token' || 
    c.name.includes('supabase')
  );
  
  const cookieDebug = allCookies.map(c => ({
    name: c.name,
    value: c.name.startsWith('sb-') || c.name === 'sb-auth-token' 
      ? `${c.value.substring(0, 10)}...` 
      : '[masked]'
  }));
  
  console.log('Server Supabase initialization:');
  console.log('- URL exists:', !!supabaseUrl);
  console.log('- Key exists:', !!supabaseKey);
  console.log('- Cookie store available:', !!cookieStore);
  console.log('- Cookies found:', allCookies.length);
  console.log('- Supabase cookies found:', supabaseCookies.length);
  console.log('- Supabase cookie names:', supabaseCookies.map(c => c.name));
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in server environment');
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
      
      console.log('- Found valid JSON auth token cookie');
      console.log('- Access token exists:', !!accessToken);
      console.log('- Refresh token exists:', !!refreshToken);
    } catch (e) {
      console.error('- Failed to parse auth token cookie:', e);
    }
  }
  
  // Create the Supabase client with enhanced cookie handling
  // @ts-ignore - Using custom cookie handling which TypeScript doesn't fully support
  return createSupabaseClient(
    supabaseUrl || '',
    supabaseKey || '',
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
                
                console.log(`Extracted token from auth JSON for: ${name}`);
                return null;
              } catch {
                // Parsing failed, continue with normal flow
              }
            }
            
            console.log(`Supabase cookie request: ${name}, NOT found`);
            return null;
          }
          
          console.log(`Supabase cookie request: ${name}, found with length: ${cookie.value.length}`);
          return cookie.value;
        },
        set(name: string, value: string, options: any) {
          // This is only used client-side in browsers
          console.log(`Server attempted to set cookie: ${name} (ignored in server context)`);
        },
        remove(name: string, options: any) {
          // This is only used client-side in browsers
          console.log(`Server attempted to remove cookie: ${name} (ignored in server context)`);
        }
      },
    }
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
    console.error('Missing Supabase admin credentials in server environment');
    throw new Error('Supabase admin client could not be initialized');
  }
  
  console.log('Creating Supabase admin client with service role');
  
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