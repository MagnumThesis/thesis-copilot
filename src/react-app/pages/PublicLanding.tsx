import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/shadcn/button";
import { ArrowRight, BookOpen, Zap, Shield } from "lucide-react";

export default function PublicLanding() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-2xl font-bold">
          <span style={{ color: 'var(--primary)' }}>
            Thesis Copilot
          </span>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className=""
            onClick={() => navigate("/login")}
            style={{ color: 'var(--muted-foreground)' }}
          >
            Login
          </Button>
          <Button
            onClick={() => navigate("/register")}
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Revolutionize Your <span style={{ color: 'var(--secondary)' }}>Research</span> Process
            </h1>
            <p className="text-xl mb-8" style={{ color: 'var(--muted-foreground)' }}>
              Thesis Copilot is your intelligent companion for academic research. Find, organize, and cite references effortlessly with AI-powered assistance.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className=""
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                onClick={() => navigate("/register")}
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className=""
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'transparent' }}
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg blur-3xl opacity-20" style={{ background: 'linear-gradient(90deg,var(--primary),var(--secondary))' }}></div>
              <div className="relative rounded-lg p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="space-y-4">
                  <div className="h-12 rounded animate-pulse" style={{ background: 'var(--muted)' }}></div>
                  <div className="h-4 rounded animate-pulse w-3/4" style={{ background: 'var(--muted)' }}></div>
                  <div className="h-4 rounded animate-pulse w-1/2" style={{ background: 'var(--muted)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20" style={{ background: 'rgba(243,244,246,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose Thesis Copilot?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Smart Reference Search",
                description: "Find relevant papers and citations instantly with AI-powered semantic search.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get results in seconds, not hours. Streamline your research workflow.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "Your research data is secure and private. We never share your information.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="rounded-lg p-8 transition"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border)' }}
                >
                  <Icon className="h-12 w-12 mb-4" style={{ color: 'var(--secondary)' }} />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Transform Your Research?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
          Join thousands of researchers who are already using Thesis Copilot to accelerate their academic work.
        </p>
        <Button
          size="lg"
          className=""
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          onClick={() => navigate("/register")}
        >
          Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
        <p>&copy; 2024 Thesis Copilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
