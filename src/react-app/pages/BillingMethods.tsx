import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { useNavigate } from 'react-router-dom';

export default function BillingMethods() {
  const navigate = useNavigate();

  const handleOpenPortal = async () => {
    alert('Stripe Customer Portal integration not configured. This is a placeholder.');
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
            <div className="flex gap-2">
              <Button onClick={handleOpenPortal}>Open Billing Portal</Button>
              <Button variant="ghost" onClick={() => navigate('/profile')}>Back to Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
