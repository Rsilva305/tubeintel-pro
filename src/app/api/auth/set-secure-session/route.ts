import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, expiresAt } = await request.json();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Missing required tokens' },
        { status: 400 }
      );
    }

    // Calculate cookie expiration
    const expiresDate = new Date(expiresAt * 1000); // Convert Unix timestamp to Date
    const refreshExpiresDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create response
    const response = NextResponse.json({ success: true });

    // Set secure httpOnly cookies
    response.cookies.set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: expiresDate,
    });

    response.cookies.set('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: refreshExpiresDate,
    });

    // Set session metadata (non-sensitive)
    response.cookies.set('session-active', 'true', {
      httpOnly: false, // Accessible to client for UI state
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: expiresDate,
    });

    return response;
  } catch (error) {
    console.error('Error setting secure session:', error);
    return NextResponse.json(
      { error: 'Failed to set secure session' },
      { status: 500 }
    );
  }
} 