import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Debug cookie information
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('Auth check cookies:', {
      count: allCookies.length,
      names: allCookies.map(c => c.name),
      hasSbCookie: allCookies.some(c => c.name.startsWith('sb-'))
    });
    
    // Try to directly extract token from cookie
    let extractedUser = null;
    const authCookie = cookieStore.get('sb-auth-token');
    
    if (authCookie) {
      try {
        console.log('Raw auth cookie found with length:', authCookie.value.length);
        const authData = JSON.parse(authCookie.value);
        
        if (authData && authData.user) {
          extractedUser = {
            id: authData.user.id,
            email: authData.user.email,
            source: 'direct_cookie_extraction'
          };
          console.log('User extracted directly from cookie:', {
            id: extractedUser.id.substring(0, 8) + '...',
            email: extractedUser.email ? extractedUser.email.substring(0, 3) + '...' : 'none'
          });
        }
      } catch (parseError) {
        console.error('Failed to parse auth cookie:', parseError);
      }
    }
    
    // Get the current user session through Supabase client
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    
    // Debug auth information
    console.log('Auth check endpoint:', {
      hasSession: !!data.session,
      hasUser: data.session ? !!data.session.user : false,
      userId: data.session?.user?.id ? data.session.user.id.substring(0, 8) + '...' : 'none',
      error: error ? error.message : null
    });
    
    // If we have a valid session from Supabase client, use that
    if (data.session && data.session.user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: data.session.user.id,
          email: data.session.user.email
        }
      });
    }
    
    // If we extracted user directly from cookie, use that as fallback
    if (extractedUser) {
      console.log('Using fallback user from cookie extraction');
      return NextResponse.json({
        authenticated: true,
        user: extractedUser,
        source: 'cookie_fallback' // Indicate this is from direct cookie extraction
      });
    }
    
    // User is not authenticated
    return NextResponse.json(
      { 
        authenticated: false,
        message: 'User not authenticated',
        hasCookie: !!authCookie
      },
      { status: 401 }
    );
    
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Failed to check authentication status',
        details: error.message
      },
      { status: 500 }
    );
  }
} 