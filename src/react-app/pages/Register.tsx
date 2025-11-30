import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/shadcn/alert";
import { useAuth } from "@/hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
  }>({ score: 0, feedback: "" });

  const [googleHover, setGoogleHover] = useState(false);
  const [githubHover, setGithubHover] = useState(false);

  const checkPasswordStrength = (pwd: string) => {
    let score = 0;
    let feedback = "";

    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    const feedbacks = [
      "Too weak",
      "Weak",
      "Fair",
      "Good",
      "Strong",
      "Very Strong",
    ];
    feedback = feedbacks[score] || "";

    setPasswordStrength({ score, feedback });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    try {
      // Validation
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setLocalError("Please fill in all fields");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }

      if (formData.password.length < 8) {
        setLocalError("Password must be at least 8 characters long");
        return;
      }

      if (!formData.agreedToTerms) {
        setLocalError("Please agree to the Terms of Service");
        return;
      }

      await register(formData.email, formData.password, formData.fullName);

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <Card style={{ background: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }} className="max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
            <p style={{ color: 'var(--muted-foreground)' }} className="mb-4">
              Your account has been successfully created. Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription style={{ color: 'var(--muted-foreground)' }}>
              Join Thesis Copilot today and start researching smarter
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(authError || localError) && (
              <Alert className="mb-6 border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500">{authError || localError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" style={{ color: 'var(--muted-foreground)' }}>
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  style={{ background: 'var(--input)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: 'var(--muted-foreground)' }}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ background: 'var(--input)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: 'var(--muted-foreground)' }}>
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{ background: 'var(--input)', color: 'var(--card-foreground)', borderColor: 'var(--border)', paddingRight: '2.5rem' }}
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded transition ${
                            i < passwordStrength.score
                              ? passwordStrength.score <= 2
                                ? "bg-red-500"
                                : passwordStrength.score <= 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-slate-600"
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p
                      className={`text-xs ${
                        passwordStrength.score <= 2
                          ? "text-red-400"
                          : passwordStrength.score <= 3
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      Strength: {passwordStrength.feedback}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" style={{ color: 'var(--muted-foreground)' }}>
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    style={{ background: 'var(--input)', color: 'var(--card-foreground)', borderColor: 'var(--border)', paddingRight: '2.5rem' }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 text-sm cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  className="rounded mt-0.5"
                  style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
                />
                <span>
                  I agree to the{" "}
                  <button className="text-blue-400 hover:text-blue-300 transition">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button className="text-blue-400 hover:text-blue-300 transition">
                    Privacy Policy
                  </button>
                </span>
              </label>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="transition font-medium"
                style={{ color: 'var(--secondary)' }}
              >
                Sign in here
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Social Sign Up (Optional) */}
        <div className="mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span style={{ padding: '0.25rem 0.75rem', background: 'var(--secondary)', color: 'var(--primary-foreground)', borderRadius: '9999px' }}>Or sign up with</span>
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
