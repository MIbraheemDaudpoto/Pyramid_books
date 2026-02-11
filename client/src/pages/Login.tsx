import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logoSrc from "@assets/pyramid-books-logo-official.jpg";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", { email, password });
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-atmosphere d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="pb-glass rounded-4 p-4 p-md-5 pb-enter" style={{ boxShadow: "var(--shadow-lift)" }}>
          <div className="text-center mb-4">
            <img
              src={logoSrc}
              alt="Pyramid Books"
              className="mb-3"
              style={{ height: 56, objectFit: "contain" }}
              data-testid="login-logo"
            />
            <p className="text-muted small mb-0">Sign in to your account</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert" data-testid="text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              <label htmlFor="password" className="form-label small fw-medium">
                Password
              </label>
              <div className="position-relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your password"
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
            </div>

            <button
              type="submit"
              className="btn btn-primary pb-sheen w-100 d-inline-flex align-items-center justify-content-center gap-2"
              disabled={loading}
              data-testid="button-login"
            >
              {loading && <Loader2 className="spinner-border spinner-border-sm" style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center mt-3">
            <Link href="/forgot-password" className="text-decoration-none small fw-medium" style={{ color: "hsl(var(--primary))" }} data-testid="link-forgot-password">
              Forgot your password?
            </Link>
          </div>

          <p className="text-center text-muted small mt-3 mb-0">
            Don't have an account?{" "}
            <Link href="/signup" className="text-decoration-none fw-medium" style={{ color: "hsl(var(--primary))" }} data-testid="link-signup">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
