import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { useAuth } from '@/hooks/useAuth';

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { loadAuthState, saveAuthState } = useAuth();
  const [status, setStatus] = useState('Checking session...');

  useEffect(() => {
    if (!sessionId) {
      setStatus('No session id provided');
      return;
    }

    const fetchSession = async () => {
      try {
        const resp = await fetch(`/api/billing/session/${sessionId}`);
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          setStatus('Failed to retrieve session');
          return;
        }

        const session = data.session;

        // Attempt to read metadata or display_items
        const metadata = session.metadata || {};

        // Basic handling: prefer metadata.credits if present, otherwise compute from line_items
        const billing = loadAuthState?.()?.billing ?? { plan: 'Free', credits: 0 };
        let newPlan = billing.plan ?? 'Free';
        let newCredits = billing.credits ?? 0;

        if (metadata.plan) {
          newPlan = metadata.plan;
        }

        // Determine credits to add: prefer metadata, else inspect expanded line_items
        let creditsToAdd = 0;
        if (metadata.credits) {
          creditsToAdd = parseInt(metadata.credits, 10) || 0;
        } else if (session.line_items && Array.isArray(session.line_items.data)) {
          for (const item of session.line_items.data) {
            const qty = (item.quantity) ? Number(item.quantity) : 1;
            // price may be expanded with metadata
            const price = item.price || item.price?.data || {};
            const priceMeta = price.metadata || {};
            if (priceMeta && priceMeta.credits) {
              creditsToAdd += (Number(priceMeta.credits) || 0) * qty;
            } else if (price.nickname) {
              // try to parse nickname like "100 credits"
              const m = String(price.nickname).match(/(\d+)\s*credits?/i);
              if (m) {
                creditsToAdd += Number(m[1]) * qty;
              }
            }
          }
        }

        newCredits = (newCredits || 0) + creditsToAdd;

        // Prevent double-processing: record processed session IDs in localStorage
        const processedKey = 'processed_checkout_sessions';
        let processed: string[] = [];
        try {
          const raw = localStorage.getItem(processedKey);
          if (raw) processed = JSON.parse(raw) as string[];
        } catch (e) {}

        if (!processed.includes(sessionId)) {
          // Persist locally
          const newState = { ...(loadAuthState?.() ?? {}), billing: { plan: newPlan, credits: newCredits, nextBilling: metadata.next_billing ?? null } };
          saveAuthState?.(newState);

          // mark processed
          processed.push(sessionId);
          try { localStorage.setItem(processedKey, JSON.stringify(processed)); } catch (e) {}
        } else {
          console.debug('Session already processed, skipping local credit application', sessionId);
        }

        setStatus('Payment successful — billing updated. Redirecting...');
        setTimeout(() => navigate('/profile'), 1500);
      } catch (err) {
        console.error(err);
        setStatus('Error verifying session');
      }
    };

    fetchSession();
  }, [sessionId, loadAuthState, saveAuthState, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription style={{ color: 'var(--muted-foreground)' }}>Checkout result</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">{status}</div>
        </CardContent>
      </Card>
    </div>
  );
}
