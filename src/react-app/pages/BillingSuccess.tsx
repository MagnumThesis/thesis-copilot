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

        // Basic handling: if metadata.credits we top up; if metadata.plan we set plan
        const billing = loadAuthState?.()?.billing ?? { plan: 'Free', credits: 0 };
        let newPlan = billing.plan ?? 'Free';
        let newCredits = billing.credits ?? 0;

        if (metadata.plan) {
          newPlan = metadata.plan;
        }

        if (metadata.credits) {
          const amt = parseInt(metadata.credits, 10) || 0;
          newCredits = (newCredits || 0) + amt;
        }

        // Persist locally
        const newState = { ...(loadAuthState?.() ?? {}), billing: { plan: newPlan, credits: newCredits, nextBilling: metadata.next_billing ?? null } };
        saveAuthState?.(newState);

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
