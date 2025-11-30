import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/shadcn/alert";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const displayError = error || localError;

  const [googleHover, setGoogleHover] = useState(false);
  const [githubHover, setGithubHover] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mb-8 transition"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        {/* Card */}
        <Card style={{ background: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription style={{ color: 'var(--muted-foreground)' }}>
              Sign in to your Thesis Copilot account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {displayError && (
              <Alert className="mb-6 border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500">{displayError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: 'var(--muted-foreground)' }}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ background: 'var(--input)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ background: 'var(--input)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-700"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="transition"
                  style={{ color: 'var(--secondary)' }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="transition font-medium"
                style={{ color: 'var(--secondary)' }}
              >
                Sign up here
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Social Login (Optional) */}
        <div className="mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span style={{ padding: '0.25rem 0.75rem', background: 'var(--secondary)', color: 'var(--primary-foreground)', borderRadius: '9999px' }}>Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onMouseEnter={() => setGoogleHover(true)}
              onMouseLeave={() => setGoogleHover(false)}
              style={{ borderColor: 'var(--border)', color: googleHover ? 'var(--primary-foreground)' : 'var(--muted-foreground)', background: googleHover ? 'var(--secondary)' : 'transparent' }}
            >
              Google
            </Button>
            <Button
              variant="outline"
              onMouseEnter={() => setGithubHover(true)}
              onMouseLeave={() => setGithubHover(false)}
              style={{ borderColor: 'var(--border)', color: githubHover ? 'var(--primary-foreground)' : 'var(--muted-foreground)', background: githubHover ? 'var(--secondary)' : 'transparent' }}
            >
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
