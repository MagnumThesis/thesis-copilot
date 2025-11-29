import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/shadcn/button";
import { ArrowRight, BookOpen, Zap, Shield } from "lucide-react";

export default function PublicLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-slate-700">
        <div className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Thesis Copilot
          </span>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="text-slate-300 hover:text-white"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/register")}
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
              Revolutionize Your <span className="text-blue-400">Research</span> Process
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Thesis Copilot is your intelligent companion for academic research. Find, organize, and cite references effortlessly with AI-powered assistance.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/register")}
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur-3xl opacity-20"></div>
              <div className="relative bg-slate-800 border border-slate-700 rounded-lg p-8">
                <div className="space-y-4">
                  <div className="h-12 bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-slate-800/50">
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
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 hover:border-blue-500 transition"
                >
                  <Icon className="h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-slate-300">{feature.description}</p>
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
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Join thousands of researchers who are already using Thesis Copilot to accelerate their academic work.
        </p>
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate("/register")}
        >
          Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 px-6 py-8 text-center text-slate-400">
        <p>&copy; 2024 Thesis Copilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
