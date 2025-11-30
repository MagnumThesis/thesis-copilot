import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getSupabase } from '../lib/supabase';
import type { SupabaseEnv } from '../lib/supabase';
import crypto from 'crypto';

// Helper: resolve environment variables using same fallback strategy
// as other services: bindings (c.env) -> process.env -> import.meta.env -> VITE_ prefixed
const metaEnv = (import.meta as any).env || {};
function resolveEnv(c: any, key: string) {
  return (c?.env && (c.env as any)[key]) || process.env[key] || metaEnv[key] || metaEnv[`VITE_${key}`];
}

const billingApi = new Hono();

billingApi.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
  maxAge: 600
}));

// Create a Stripe Checkout session (dev-mode friendly)
billingApi.post('/create-checkout-session', async (c) => {
  try {
    const body = await c.req.json();
    const { priceId, mode = 'payment', quantity = 1, metadata = {} } = body;

    // Determine Stripe secret key from environment using project's fallback resolver
    const STRIPE_SECRET = resolveEnv(c, 'STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'Stripe secret key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Build success/cancel URLs based on incoming Origin header or a sensible fallback
    const origin = c.req.header('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/profile`;

    const params = new URLSearchParams();
    params.append('mode', mode);
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    // line item
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', String(quantity));

    // include metadata
    Object.entries(metadata || {}).forEach(([k, v]) => {
      params.append(`metadata[${k}]`, String(v));
    });

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const data: any = await resp.json();

    if (!resp.ok) {
      console.error('Stripe error', data);
      return new Response(JSON.stringify({ success: false, error: data }), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, url: data.url, id: data.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
    console.error('Create checkout session error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

// Retrieve a Stripe Checkout session by id
billingApi.get('/session/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const STRIPE_SECRET = resolveEnv(c, 'STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'Stripe secret key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Request expanded line_items.price so the client can compute purchased credits if needed
    const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}?expand[]=line_items.data.price`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`
      }
    });

    const data: any = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ success: false, error: data }), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, session: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Get checkout session error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});


// Create a Stripe Customer Portal session for a given customer (or user)
billingApi.post('/create-portal-session', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({} as any));
    let { customerId, userId, email, return_url } = body || {};

    const STRIPE_SECRET = resolveEnv(c, 'STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'Stripe secret key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Try to resolve customerId from the database if not supplied
    if (!customerId) {
      try {
        const supabase = getSupabase(c.env as SupabaseEnv);
        if (userId) {
          const { data: profile } = await (supabase as any).from('user_profiles').select('id, email, stripe_customer_id').eq('id', userId).limit(1).maybeSingle();
          if (profile && (profile as any).stripe_customer_id) customerId = (profile as any).stripe_customer_id;
          if (!email && profile && (profile as any).email) email = (profile as any).email;
        }

        if (!customerId && email) {
          const { data: profileByEmail } = await (supabase as any).from('user_profiles').select('stripe_customer_id').eq('email', email).limit(1).maybeSingle();
          if (profileByEmail && (profileByEmail as any).stripe_customer_id) customerId = (profileByEmail as any).stripe_customer_id;
        }
      } catch (e) {
        console.warn('Failed to lookup customer in Supabase', e);
      }
    }

    if (!customerId) {
      // Try to resolve or create a Stripe Customer using email as a fallback.
      if (!email) {
        return new Response(JSON.stringify({ success: false, error: 'No Stripe customer id found for this user. Ensure a Checkout session was completed.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      try {
        // 1) Try to find an existing Stripe Customer by email
        const listResp = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${STRIPE_SECRET}` }
        });
        const listData: any = await listResp.json();
        if (listResp.ok && Array.isArray(listData.data) && listData.data.length > 0) {
          customerId = listData.data[0].id;
        }
      } catch (e) {
        console.warn('Failed to search Stripe customers by email', e);
      }

      // 2) If still not found, create a new Customer in Stripe so portal can be opened
      if (!customerId) {
        try {
          const createResp = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${STRIPE_SECRET}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ email: email, ['metadata[user_id]']: userId || '' }).toString()
          });
          const createData: any = await createResp.json();
          if (createResp.ok && createData && createData.id) {
            customerId = createData.id;
            // Persist mapping to Supabase if possible
            try {
              const supabase = getSupabase(c.env as SupabaseEnv);
              if (userId) {
                await (supabase as any).from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', userId).catch(() => {});
              }
              await (supabase as any).from('billing_customers').upsert({ stripe_customer_id: customerId, email: email || null, user_id: userId || null }, { onConflict: 'stripe_customer_id' });
            } catch (e) {
              console.debug('Failed to persist created Stripe customer to Supabase', e);
            }
          }
        } catch (e) {
          console.warn('Failed to create Stripe customer', e);
        }
      }

      if (!customerId) {
        return new Response(JSON.stringify({ success: false, error: 'No Stripe customer id found or created for this user.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const origin = c.req.header('origin') || 'http://localhost:3000';
    const returnUrl = return_url || origin;

    const params = new URLSearchParams();
    params.append('customer', customerId);
    params.append('return_url', returnUrl);

    const resp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data: any = await resp.json();
    if (!resp.ok) {
      console.error('Stripe portal error', data);
      return new Response(JSON.stringify({ success: false, error: data }), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, url: data.url, id: data.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Create portal session error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});


// Stripe webhook endpoint to persist billing events server-side
billingApi.post('/webhook', async (c) => {
  // Read raw body for signature verification
  const payload = await c.req.text();
  const sigHeader = c.req.header('stripe-signature') || c.req.header('Stripe-Signature');
  const STRIPE_WEBHOOK_SECRET = resolveEnv(c, 'STRIPE_WEBHOOK_SECRET');

  let event: any = null;

  try {
    if (STRIPE_WEBHOOK_SECRET && sigHeader) {
      // Verify signature using Stripe's signing scheme (t=timestamp,v1=signature,...)
      const parts = sigHeader.split(',').map((p: string) => p.split('='));
      const t = parts.find((p: string[]) => p[0] === 't')?.[1];
      const v1 = parts.find((p: string[]) => p[0] === 'v1')?.[1];

      if (!t || !v1) throw new Error('Invalid stripe-signature header');

      // Prepare signed payload
      const signedPayload = `${t}.${payload}`;
      const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload).digest('hex');

      // compare signatures in a timing-safe way
      const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
      if (!valid) throw new Error('Invalid webhook signature');
    }

    event = JSON.parse(payload);
  } catch (err: any) {
    console.error('Webhook signature/parse error', err);
    // If webhook secret not configured we still attempt to parse the event (dev-friendly)
    if (!event) {
      try { event = JSON.parse(payload); } catch (e) { return c.text('Invalid payload', 400); }
    }
  }

  try {
    const supabase = getSupabase(c.env as SupabaseEnv);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer;
        const subscriptionId = session.subscription || null;
        const metadata = session.metadata || {};
        const email = session.customer_details?.email || metadata.email || metadata.user_email || null;

        // Persist minimal data: stripe customer + subscription on user_profiles by email or metadata.user_id
        if (metadata.user_id) {
          try {
            await (supabase as any).from('user_profiles').update({ stripe_customer_id: customerId, stripe_subscription_id: subscriptionId }).eq('id', metadata.user_id);
          } catch (e) {
            console.warn('Failed to update user_profiles by id', e);
          }
        } else if (email) {
          try {
            await (supabase as any).from('user_profiles').update({ stripe_customer_id: customerId, stripe_subscription_id: subscriptionId }).eq('email', email);
          } catch (e) {
            console.warn('Failed to update user_profiles by email', e);
          }
        }

        // Also log into a billing_customers table if present
        try {
          await (supabase as any).from('billing_customers').upsert({ stripe_customer_id: customerId, email: email || null, user_id: metadata.user_id || null }, { onConflict: 'stripe_customer_id' });
        } catch (e) {
          // table may not exist yet; ignore
          console.debug('billing_customers upsert skipped or failed', e);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        // Optionally persist last successful payment timestamp
        try {
          await (supabase as any).from('billing_subscriptions').upsert({ stripe_subscription_id: subscriptionId, stripe_customer_id: customerId, stripe_status: 'active', current_period_end: invoice.current_period_end ? new Date(invoice.current_period_end * 1000).toISOString() : null }, { onConflict: 'stripe_subscription_id' });
        } catch (e) {
          // ignore if table not present
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as any;
        const subscriptionId = sub.id;
        const customerId = sub.customer;
        const status = sub.status;
        const current_period_end = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

        try {
          await (supabase as any).from('billing_subscriptions').upsert({ stripe_subscription_id: subscriptionId, stripe_customer_id: customerId, stripe_status: status, current_period_end }, { onConflict: 'stripe_subscription_id' });
        } catch (e) {
          // ignore
        }
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object as any;
        const customerId = customer.id;
        const email = customer.email || null;
        if (email) {
          try {
            await (supabase as any).from('user_profiles').update({ stripe_customer_id: customerId }).eq('email', email);
          } catch (e) {
            // ignore
          }
        }
        break;
      }

      default:
        console.debug('Unhandled Stripe event:', event.type);
    }
  } catch (err) {
    console.error('Webhook processing error', err);
  }

  return c.text('ok', 200);
});

export default billingApi;
