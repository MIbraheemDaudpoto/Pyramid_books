import { useState } from "react";
import { Link } from "wouter";
import { Boxes, Loader2, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      const data = await res.json();
      setMessage(data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
              Forgot Password
            </h4>
            <p className="text-muted small mb-0">
              {submitted
                ? "Your request has been submitted"
                : "Enter your email to request a password reset"}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert" data-testid="text-error">
              {error}
            </div>
          )}

          {submitted ? (
            <div>
              <div className="alert alert-success py-2 small" role="alert" data-testid="text-success">
                {message}
              </div>
              <p className="text-muted small mt-3">
                Your administrator will provide you with a password reset link.
                Please contact them via phone or in person.
              </p>
              <Link
                href="/login"
                className="btn btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center gap-2 mt-3"
                data-testid="link-back-to-login"
              >
                <ArrowLeft style={{ width: 16, height: 16 }} />
                Back to Sign In
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                className="btn btn-primary pb-sheen w-100 d-inline-flex align-items-center justify-content-center gap-2"
                disabled={loading}
                data-testid="button-submit"
              >
                {loading && <Loader2 className="spinner-border spinner-border-sm" style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                {loading ? "Submitting..." : "Request Password Reset"}
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
