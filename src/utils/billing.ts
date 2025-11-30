export async function createCheckoutSession(body: { mode?: string; priceId: string; quantity?: number; metadata?: Record<string, any> }) {
  const resp = await fetch('/api/billing/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err || 'Failed to create checkout session');
  }

  return resp.json();
}
