import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { createCheckoutSession } from '@/utils/billing';
import { useNavigate } from 'react-router-dom';

export default function BillingTopUp() {
  const navigate = useNavigate();

  const handleBuy = async (amount: number) => {
    try {
      const priceKey = amount === 100 ? 'VITE_STRIPE_PRICE_CREDITS_100' : 'VITE_STRIPE_PRICE_CREDITS_500';
      const priceId = (import.meta as any).env?.[priceKey];
      if (!priceId) {
        alert('Stripe price not configured. Falling back to local top-up.');
        navigate('/profile');
        return;
      }
      const data = await createCheckoutSession({ mode: 'payment', priceId, quantity: 1, metadata: { credits: String(amount) } });
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert('Failed to start checkout');
    }
  }

  return (
    <div className="min-h-screen px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Top up credits</h2>
        <p className="text-sm text-muted-foreground mb-6">Purchase additional credits for your account</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>100 credits</CardTitle>
              <CardDescription>One-time purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm">Good for casual use</div>
              <Button onClick={() => handleBuy(100)}>Buy 100</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>500 credits</CardTitle>
              <CardDescription>Best value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm">Save more per credit</div>
              <Button onClick={() => handleBuy(500)}>Buy 500</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
