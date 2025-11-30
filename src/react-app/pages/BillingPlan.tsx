import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '@/utils/billing';
import { useAuthAutoLoad as useAuth } from '@/hooks/useAuth';

export default function BillingPlan() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChoosePro = async () => {
    try {
      const priceId = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
      if (!priceId) {
        // fallback: just navigate back with message
        alert('Stripe price not configured. Falling back to local change.');
        navigate('/profile');
        return;
      }

      const data = await createCheckoutSession({ mode: 'subscription', priceId, metadata: { plan: 'Pro', user_id: user?.id ?? null, email: (user as any)?.email ?? null } });
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert('Failed to start checkout');
    }
  }

  return (
    <div className="min-h-screen px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Subscription plans</h2>
          <p className="text-sm text-muted-foreground">Choose a plan that fits your needs</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Basic access — $0/mo</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 mb-4">
                <li>• Personal use</li>
                <li>• Limited credits</li>
              </ul>
              <Button onClick={() => navigate('/profile')}>Choose Free</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>$9 / month — recommended</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 mb-4">
                <li>• Increased credits</li>
                <li>• Priority support</li>
              </ul>
              <Button onClick={handleChoosePro} disabled={!user}>Upgrade to Pro</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
