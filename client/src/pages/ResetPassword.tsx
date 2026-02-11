import { useState, useMemo } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { Boxes, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#e74c3c" };
  if (score <= 3) return { score, label: "Fair", color: "#f39c12" };
  return { score, label: "Strong", color: "#27ae60" };
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const token = useMemo(() => new URLSearchParams(searchString).get("token") || "", [searchString]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, password });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Reset failed.");
      }
    } catch (err: any) {
      setError(err.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="app-atmosphere d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: 440 }}>
          <div className="pb-glass rounded-4 p-4 p-md-5 pb-enter" style={{ boxShadow: "var(--shadow-lift)" }}>
            <div className="text-center">
              <h4 className="fw-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Invalid Reset Link
              </h4>
              <p className="text-muted small">
                This password reset link is invalid or missing. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="btn btn-primary pb-sheen w-100 mt-3"
                data-testid="link-forgot-password"
              >
                Request Password Reset
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-atmosphere d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="pb-glass rounded-4 p-4 p-md-5 pb-enter" style={{ boxShadow: "var(--shadow-lift)" }}>
          <div className="text-center mb-4">
            <div
              className="rounded-4 d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 92%)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <Boxes className="text-white" style={{ width: 26, height: 26 }} />
            </div>
            <h4 className="fw-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
              {success ? "Password Reset" : "Set New Password"}
            </h4>
            <p className="text-muted small mb-0">
              {success ? "Your password has been updated" : "Enter your new password below"}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert" data-testid="text-error">
              {error}
            </div>
          )}

          {success ? (
            <div>
              <div className="alert alert-success py-2 small d-flex align-items-center gap-2" role="alert" data-testid="text-success">
                <CheckCircle style={{ width: 16, height: 16 }} />
                Password has been reset successfully!
              </div>
              <button
                className="btn btn-primary pb-sheen w-100 mt-3"
                onClick={() => setLocation("/login")}
                data-testid="button-go-to-login"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="password" className="form-label small fw-medium">
                  New Password
                </label>
                <div className="position-relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 42 }}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{ lineHeight: 1 }}
                  >
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="d-flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: 4,
                            flex: 1,
                            borderRadius: 2,
                            background: i <= strength.score ? strength.color : "#e0e0e0",
                            transition: "background 0.2s",
                          }}
                        />
                      ))}
                    </div>
                    <span className="small" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label small fw-medium">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary pb-sheen w-100 d-inline-flex align-items-center justify-content-center gap-2"
                disabled={loading}
                data-testid="button-reset"
              >
                {loading && <Loader2 className="spinner-border spinner-border-sm" style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <p className="text-center text-muted small mt-4 mb-0">
            Remember your password?{" "}
            <Link href="/login" className="text-decoration-none fw-medium" style={{ color: "hsl(var(--primary))" }} data-testid="link-login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
