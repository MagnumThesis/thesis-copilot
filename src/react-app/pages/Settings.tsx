import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/shadcn/card";
import { PrivacyControls } from "@/components/ui/privacy-controls";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;
  const backLabel = from === '/profile' ? 'Back to Profile' : 'Back to App';

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage privacy & data settings for your account</p>
          </div>
          <div>
            <button
              className="text-sm text-muted-foreground"
              onClick={() => navigate(from === '/profile' ? '/profile' : '/app')}
            >
              {backLabel}
            </button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Privacy & Data</CardTitle>
            <CardDescription style={{ color: 'var(--muted-foreground)' }}>Controls for consent, retention, export and deletion</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Make the inner privacy controls scrollable without changing root/layout behaviour.
                Use a constrained maxHeight so the page root still determines overall layout,
                but the card content can scroll when it overflows. */}
            <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 8 }}>
              <PrivacyControls />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
