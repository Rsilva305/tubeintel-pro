import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    console.log('=== SET PRO SUBSCRIPTION TEST ===');
    
    // Get authenticated user
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // If not authenticated, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        message: 'Please login to set subscription' 
      }, { status: 401 });
    }
    
    // Request body should contain plan type
    const body = await req.json();
    const planType = body.plan_type || 'pro'; // Default to pro if not specified
    
    // Create admin client to bypass RLS
    const adminClient = createAdminClient();
    
    // Generate a UUID for the subscription ID
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // Set expiry date to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Create subscription data
    const subscriptionData = {
      id: generateUUID(),
      user_id: userId,
      plan_type: planType,
      status: 'active',
      created_at: new Date().toISOString(),
      current_period_end: expiryDate.toISOString(),
      stripe_subscription_id: `test_${Date.now()}`,
      stripe_customer_id: `cus_test_${Date.now()}`
    };
    
    // First check if user already has an active subscription
    const { data: existingSub } = await adminClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    let result;
    if (existingSub) {
      // Update existing subscription
      result = await adminClient
        .from('user_subscriptions')
        .update({
          plan_type: planType,
          current_period_end: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);
        
      console.log('Updated existing subscription:', result);
    } else {
      // Insert new subscription
      result = await adminClient
        .from('user_subscriptions')
        .insert(subscriptionData);
        
      console.log('Inserted new subscription:', result);
    }
    
    if (result.error) {
      console.error('Error setting subscription:', result.error);
      return NextResponse.json({ 
        success: false,
        error: result.error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Subscription set to ${planType}`,
      user_id: userId,
      expiryDate: expiryDate.toISOString(),
      subscription: existingSub ? { ...existingSub, plan_type: planType } : subscriptionData
    });
    
  } catch (error: any) {
    console.error('Error setting subscription:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
} 