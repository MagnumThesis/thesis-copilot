import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const navigate = useNavigate();
  const { loadAuthState, saveAuthState } = useAuth();
  const [user, setUser] = useState<{ email?: string; fullName?: string } | null>(null);

  useEffect(() => {
    const state = loadAuthState?.();
    setUser(state?.user ?? null);
  }, [loadAuthState]);

  const initials = (user?.fullName || "").split(" ").map(s => s[0] ?? "").join("").slice(0,2).toUpperCase();

  // Billing info (read from auth state or localStorage)
  const [plan, setPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [nextBilling, setNextBilling] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const state = loadAuthState?.();
    const b = (state as any)?.billing;
    if (b) {
      setPlan(b.plan ?? 'Free');
      setCredits(b.credits ?? 0);
      setNextBilling(b.nextBilling ?? null);
    } else {
      try {
        const raw = localStorage.getItem('billing');
        if (raw) {
          const parsed = JSON.parse(raw);
          setPlan(parsed.plan ?? 'Free');
          setCredits(parsed.credits ?? 0);
          setNextBilling(parsed.nextBilling ?? null);
        }
      } catch (e) {}
    }
  }, [loadAuthState]);

  const persistBilling = (newPlan: string, newCredits: number, newNextBilling: string | null) => {
    try {
      const state = loadAuthState?.() ?? {};
      const newState = { ...state, billing: { plan: newPlan, credits: newCredits, nextBilling: newNextBilling } };
      saveAuthState?.(newState);
      try {
        localStorage.setItem('billing', JSON.stringify({ plan: newPlan, credits: newCredits, nextBilling: newNextBilling }));
      } catch (e) {}
    } catch (e) {
      console.error('Failed to persist billing', e);
    }
  }

  const handlePlanChange = (selected: string) => {
    // If Stripe price IDs are configured, open Checkout. Otherwise fall back to local update.
    const STRIPE_PRICE_PRO = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
    if (STRIPE_PRICE_PRO && selected === 'Pro') {
      // create checkout session for subscription
      createCheckoutSession({ mode: 'subscription', priceId: STRIPE_PRICE_PRO, metadata: { plan: 'Pro' } });
      return;
    }

    // Local fallback
    setPlan(selected);
    let nb: string | null = null;
    if (selected === 'Pro') {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      nb = next.toISOString().slice(0,10);
      setNextBilling(nb);
    } else {
      setNextBilling(null);
    }
    persistBilling(selected, credits ?? 0, nb);
    setMessage('Subscription updated');
    setTimeout(() => setMessage(null), 2000);
  }

  const handleTopUp = (amount: number) => {
    // If Stripe price IDs exist, open Checkout for credit purchase
    const STRIPE_PRICE_CREDITS_100 = (import.meta as any).env?.VITE_STRIPE_PRICE_CREDITS_100;
    const STRIPE_PRICE_CREDITS_500 = (import.meta as any).env?.VITE_STRIPE_PRICE_CREDITS_500;
    if (amount === 100 && STRIPE_PRICE_CREDITS_100) {
      createCheckoutSession({ mode: 'payment', priceId: STRIPE_PRICE_CREDITS_100, quantity: 1, metadata: { credits: String(100) } });
      return;
    }
    if (amount === 500 && STRIPE_PRICE_CREDITS_500) {
      createCheckoutSession({ mode: 'payment', priceId: STRIPE_PRICE_CREDITS_500, quantity: 1, metadata: { credits: String(500) } });
      return;
    }

    // Local fallback
    const updated = (credits ?? 0) + amount;
    setCredits(updated);
    persistBilling(plan ?? 'Free', updated, nextBilling ?? null);
    setMessage(`Added ${amount} credits`);
    setTimeout(() => setMessage(null), 2000);
  }

  const createCheckoutSession = async ({ mode = 'payment', priceId, quantity = 1, metadata = {} }: { mode?: string; priceId: string; quantity?: number; metadata?: Record<string, any> }) => {
    try {
      const resp = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, priceId, quantity, metadata })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        console.error('Create checkout session failed', data);
        setMessage('Failed to start checkout');
        setTimeout(() => setMessage(null), 2500);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage('No checkout url returned');
      }
    } catch (err) {
      console.error('Checkout error', err);
      setMessage('Checkout error');
      setTimeout(() => setMessage(null), 2500);
    }
  }

  return (
    <div className="min-h-screen px-8 py-12" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-3xl w-full mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Profile</h2>
            <p className="text-sm text-muted-foreground">View and manage your profile</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/settings')}>Settings</Button>
            <Button variant="ghost" onClick={() => navigate('/app')}>Back to App</Button>
          </div>
        </div>

        <Card style={{ background: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold text-white">
                {initials || <UserIcon className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-sm font-medium truncate">{user?.fullName ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? "—"}</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-semibold">Subscription</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-medium">{plan ?? 'Free'}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-muted-foreground">Remaining credits</span>
                <span className="text-sm font-medium">{credits ?? 0}</span>
              </div>
            
              <div className="mt-4 flex gap-3">
                <Button onClick={() => navigate('/billing/plan')}>Manage Plan</Button>
                <Button onClick={() => navigate('/billing/topup')}>Add Credits</Button>
                <Button variant="ghost" onClick={() => navigate('/billing/methods')}>Manage Billing</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
