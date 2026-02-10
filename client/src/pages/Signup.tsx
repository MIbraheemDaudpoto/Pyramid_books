import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Boxes, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: "", color: "transparent", width: "0%" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "#e74c3c", width: "33%" };
  if (score <= 3) return { label: "Medium", color: "#f39c12", width: "66%" };
  return { label: "Strong", color: "#27ae60", width: "100%" };
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", {
        firstName,
        lastName,
        email,
        phone: phone.trim() || undefined,
        password,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-atmosphere d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", paddingTop: 24, paddingBottom: 24 }}>
      <div className="container" style={{ maxWidth: 480 }}>
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
              Create your account
            </h4>
            <p className="text-muted small mb-0">Join Pyramid Books</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert" data-testid="text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label htmlFor="firstName" className="form-label small fw-medium">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="form-control"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="col-6">
                <label htmlFor="lastName" className="form-label small fw-medium">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="form-control"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="form-label small fw-medium">
                Phone <span className="text-muted">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label small fw-medium">
                Password
              </label>
              <div className="position-relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: "hsl(var(--border))" }}>
                      <div
                        style={{
                          height: "100%",
                          width: strength.width,
                          borderRadius: 2,
                          background: strength.color,
                          transition: "width 300ms ease, background 300ms ease",
                        }}
                      />
                    </div>
                    <span className="small fw-medium" style={{ color: strength.color, minWidth: 52 }}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label small fw-medium">
                Confirm password
              </label>
              <div className="position-relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingRight: 42 }}
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  style={{ lineHeight: 1 }}
                >
                  {showConfirmPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <div className="text-danger small mt-1">Passwords do not match</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary pb-sheen w-100 d-inline-flex align-items-center justify-content-center gap-2"
              disabled={loading}
              data-testid="button-signup"
            >
              {loading && <Loader2 className="spinner-border spinner-border-sm" style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-muted small mt-4 mb-0">
            Already have an account?{" "}
            <Link href="/login" className="text-decoration-none fw-medium" style={{ color: "hsl(var(--primary))" }} data-testid="link-login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
