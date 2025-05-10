import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get the Supabase user directly
    const { data: { user } } = await supabase.auth.getUser();
    
    // Return the authentication status
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      } : null
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to check authentication'
    }, { status: 500 });
  }
} 