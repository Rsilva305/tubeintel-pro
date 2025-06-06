import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear all secure session cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(0), // Expire immediately
    };

    response.cookies.set('sb-access-token', '', cookieOptions);
    response.cookies.set('sb-refresh-token', '', cookieOptions);
    
    // Clear session metadata cookie
    response.cookies.set('session-active', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Error clearing secure session:', error);
    return NextResponse.json(
      { error: 'Failed to clear secure session' },
      { status: 500 }
    );
  }
} 