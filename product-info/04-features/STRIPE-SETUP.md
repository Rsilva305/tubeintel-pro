# Stripe Integration Setup for TubeIntel Pro

This guide explains how to set up and configure Stripe payments for TubeIntel Pro.

## Prerequisites

Before you begin, make sure you have:

1. A Stripe account (create one at [stripe.com](https://stripe.com) if you don't have it)
2. Access to the TubeIntel Pro codebase
3. Access to the Supabase database

## Step 1: Configure Stripe Account

1. Sign in to your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create your products and pricing plans:
   - Navigate to Products > Add Product
   - Create "Pro" product with monthly recurring price
   - Create "Pro Plus" product with monthly recurring price
   - Take note of the price IDs for each plan

## Step 2: Set Up Environment Variables

Add the following variables to your `.env.local` file:

```
STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

For production, update these with live keys in your Vercel environment variables.

## Step 3: Create Database Table

Run the SQL script from `src/lib/subscription-schema.sql` in your Supabase SQL editor to:

1. Create the `user_subscriptions` table
2. Set up Row Level Security policies
3. Create helper functions for subscription checks

## Step 4: Update Product IDs

In `src/utils/stripe.ts`, update the product and price IDs with your actual Stripe product IDs:

```javascript
export const PRODUCTS = {
  PRO: {
    name: 'Pro',
    id: 'prod_your_pro_product_id', 
    priceId: 'price_your_pro_price_id',
    // ...
  },
  PRO_PLUS: {
    name: 'Pro Plus',
    id: 'prod_your_pro_plus_product_id',
    priceId: 'price_your_pro_plus_price_id',
    // ...
  }
};
```

## Step 5: Set Up Webhooks

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Add a new endpoint with the URL: `https://your-site.com/api/stripe/webhook`
3. Subscribe to the following events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret and update your `STRIPE_WEBHOOK_SECRET` environment variable

## Step 6: Testing

1. To test payments in development:
   - Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Make test purchases with Stripe test cards (e.g., `4242 4242 4242 4242`)

2. Test each subscription flow:
   - New subscription
   - Subscription renewal
   - Subscription cancellation

## Implementation Details

### Key Files

- `src/utils/stripe.ts` - Stripe configuration and helpers
- `src/app/api/stripe/checkout/route.ts` - API endpoint for creating checkout sessions
- `src/app/api/stripe/webhook/route.ts` - Webhook handler for Stripe events
- `src/app/subscription/page.tsx` - Subscription selection page
- `src/utils/subscription.ts` - Helper functions for checking subscription status
- `src/components/SubscriptionGate.tsx` - Component for access control

### Usage Example

To protect features based on subscription level:

```jsx
import SubscriptionGate from '@/components/SubscriptionGate';

export default function AdvancedFeaturePage() {
  return (
    <div>
      <h1>Advanced Analytics</h1>
      
      <SubscriptionGate requiredFeature="pro">
        {/* Pro-only content here */}
        <div>
          <h2>Advanced Analysis Tools</h2>
          <p>This content is only visible to Pro subscribers.</p>
        </div>
      </SubscriptionGate>
    </div>
  );
}
``` 