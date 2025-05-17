import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // If not authenticated, return error
    if (!session || !session.user) {
      return NextResponse.json({ 
        authenticated: false,
        hasUpgrades: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check for recent upgrade events (created in the last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: events, error } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'upgrade')
      .gte('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error checking for subscription upgrades:', error);
      return NextResponse.json({ 
        authenticated: true,
        hasUpgrades: false,
        error: 'Failed to check for subscription upgrades'
      }, { status: 500 });
    }
    
    // Return the upgrade events and whether there are any
    return NextResponse.json({
      authenticated: true,
      hasUpgrades: events && events.length > 0,
      events: events
    });
    
  } catch (error) {
    console.error('Error in check-upgrades endpoint:', error);
    return NextResponse.json({ 
      authenticated: false,
      hasUpgrades: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 