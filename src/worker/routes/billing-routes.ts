import { Hono } from 'hono';
import { cors } from 'hono/cors';

const billingApi = new Hono();

billingApi.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));

// Create a Stripe Checkout session (dev-mode friendly)
billingApi.post('/create-checkout-session', async (c) => {
  try {
    const body = await c.req.json();
    const { priceId, mode = 'payment', quantity = 1, metadata = {} } = body;

    // Determine Stripe secret key from environment
    const STRIPE_SECRET = (c.env && (c.env as any).STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET) {
      return c.json({ success: false, error: 'Stripe secret key not configured' }, 500);
    }

    // Build success/cancel URLs based on incoming Origin header or a sensible fallback
    const origin = c.req.headers.get('origin') || `${c.req.proto}://${c.req.host}` || 'http://localhost:3000';
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

    const data = await resp.json();

    if (!resp.ok) {
      console.error('Stripe error', data);
      return c.json({ success: false, error: data }, resp.status);
    }

    return c.json({ success: true, url: data.url, id: data.id });
  } catch (err: any) {
    console.error('Create checkout session error', err);
    return c.json({ success: false, error: err?.message || String(err) }, 500);
  }
});

// Retrieve a Stripe Checkout session by id
billingApi.get('/session/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const STRIPE_SECRET = (c.env && (c.env as any).STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET) {
      return c.json({ success: false, error: 'Stripe secret key not configured' }, 500);
    }

    const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`
      }
    });

    const data = await resp.json();
    if (!resp.ok) {
      return c.json({ success: false, error: data }, resp.status);
    }

    return c.json({ success: true, session: data });
  } catch (err: any) {
    console.error('Get checkout session error', err);
    return c.json({ success: false, error: err?.message || String(err) }, 500);
  }
});

export default billingApi;
