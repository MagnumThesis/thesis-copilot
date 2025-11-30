import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { useNavigate } from 'react-router-dom';
import { useAuthAutoLoad as useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function BillingMethods() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const resp = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id ?? null,
          email: (user as any)?.email ?? null
        })
      });

      const data = await resp.json();
      if (data?.success && data.url) {
        window.location.href = data.url;
        return;
      }

      console.warn('Portal open failed', data);
      // Prefer readable error messages when available
      const msg = data?.error?.message || data?.error || 'Failed to open billing portal. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } catch (err: any) {
      console.error('Open portal error', err);
      setError(err?.message || String(err) || 'Unknown error opening billing portal');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Payment methods</h2>
        <p className="text-sm text-muted-foreground mb-6">Manage saved cards and payment methods</p>

        <Card>
          <CardHeader>
            <CardTitle>Billing methods</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">No payment methods are currently connected.</p>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">Failed to open billing portal</div>
                    <div className="text-sm mt-1">{error}</div>
                  </div>
                  <div>
                    <Button variant="ghost" onClick={() => setError(null)}>Dismiss</Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button onClick={handleOpenPortal} disabled={isLoading || !user}>{isLoading ? 'Retrying…' : 'Retry'}</Button>
                  <a className="text-sm underline text-muted-foreground" href="mailto:support@yourapp.example">Contact support</a>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleOpenPortal} disabled={isLoading || !user}>{isLoading ? 'Opening…' : 'Open Billing Portal'}</Button>
              <Button variant="ghost" onClick={() => navigate('/profile')}>Back to Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
