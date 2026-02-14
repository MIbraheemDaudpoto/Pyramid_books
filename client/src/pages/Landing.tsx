import Seo from "@/components/Seo";
import { Sparkles, ShieldCheck, TrendingUp, Truck } from "lucide-react";
import logoSrc from "@assets/pyramid-books-logo-official.jpg";

export default function Landing() {
  return (
    <div className="app-atmosphere" style={{ minHeight: "100vh" }}>
      <Seo
        title="Pyramid Books | Best Online Bookstore in Hyderabad"
        description="Buy books online at Pyramid Books Hyderabad. School course books, story books, novels and fast delivery across Hyderabad."
      />

      <div className="container-fluid px-3 px-md-4 px-lg-5">
        <div className="py-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <img
              src={logoSrc}
              alt="Pyramid Books"
              style={{ height: 48, objectFit: "contain" }}
              data-testid="landing-logo"
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-primary d-none d-sm-inline-flex"
              onClick={() => window.location.href = "/login"}
              data-testid="landing-login-secondary"
            >
              Sign in
            </button>
            <button
              className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
              onClick={() => window.location.href = "/signup"}
              data-testid="landing-signup"
            >
              <Sparkles className="w-4 h-4" />
              Get Started
            </button>
          </div>
        </div>

        <div className="row g-4 g-lg-5 align-items-stretch py-3 py-lg-5">
          <div className="col-12 col-lg-6">
            <div className="pb-enter">
              <div
                className="badge rounded-pill text-bg-light border"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                data-testid="landing-badge"
              >
                Role-based • Fast • Audit-friendly
              </div>

              <h1 className="mt-3 mb-3" style={{ fontSize: "clamp(2.2rem, 1.5rem + 2.4vw, 3.6rem)" }}>
                Your Favorite <span style={{ color: "hsl(var(--primary))" }}>Online Bookstore in Hyderabad</span>.
              </h1>

              <p className="text-muted" style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 620 }}>
                Discover a wide collection of <strong>online books</strong> at Pyramid Books.
                Whether you're looking for <strong>school course books</strong>, novels, or educational resources,
                we are the premier destination for <strong>books in Hyderabad</strong> with reliable fast delivery.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                <button
                  className="btn btn-primary btn-lg pb-sheen d-inline-flex align-items-center justify-content-center gap-2"
                  onClick={() => window.location.href = "/signup"}
                  data-testid="landing-cta"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Account
                </button>
                <button
                  className="btn btn-outline-primary btn-lg"
                  onClick={() => window.location.href = "/login"}
                  data-testid="landing-login"
                >
                  Sign In
                </button>
              </div>

              <div className="d-flex flex-wrap gap-3 mt-4">
                <div className="d-inline-flex align-items-center gap-2 text-muted small">
                  <ShieldCheck className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                  Access controls by role
                </div>
                <div className="d-inline-flex align-items-center gap-2 text-muted small">
                  <Truck className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  Order status workflow
                </div>
                <div className="d-inline-flex align-items-center gap-2 text-muted small">
                  <TrendingUp className="w-4 h-4" style={{ color: "hsl(152 52% 42%)" }} />
                  KPIs on the front page
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div
              className="pb-glass rounded-5 p-4 p-md-5 h-100"
              style={{ boxShadow: "var(--shadow-lift)" }}
              data-testid="landing-hero-card"
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                  What you’ll manage
                </div>
                <div className="text-muted small">Pyramid Books</div>
              </div>

              <div className="row g-3 mt-2">
                {[
                  { title: "Books", desc: "Catalog, categories, stock & reorder.", tone: "accent" as const },
                  { title: "Customers", desc: "Assigned sales ownership, credit limits.", tone: "primary" as const },
                  { title: "Orders", desc: "Draft → confirmed → shipped → delivered.", tone: "primary" as const },
                  { title: "Payments", desc: "Cash, bank, references & notes.", tone: "accent" as const },
                ].map((c) => (
                  <div key={c.title} className="col-12 col-sm-6">
                    <div
                      className="rounded-4 p-3 h-100"
                      style={{
                        background:
                          "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)",
                        border: "1px solid hsl(var(--border) / 1)",
                        boxShadow: "var(--shadow-soft)",
                        transition: "transform 220ms ease, box-shadow 220ms ease",
                      }}
                    >
                      <div className="d-flex align-items-start justify-content-between">
                        <div>
                          <div className="fw-bold">{c.title}</div>
                          <div className="text-muted small mt-1">{c.desc}</div>
                        </div>
                        <span
                          className="badge rounded-pill"
                          style={{
                            background:
                              c.tone === "primary"
                                ? "hsl(var(--primary) / .12)"
                                : "hsl(var(--accent) / .12)",
                            color:
                              c.tone === "primary" ? "hsl(var(--primary))" : "hsl(var(--accent))",
                            border:
                              c.tone === "primary"
                                ? "1px solid hsl(var(--primary) / .25)"
                                : "1px solid hsl(var(--accent) / .25)",
                          }}
                        >
                          Module
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-4 p-3 p-md-4" style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / .14) 0%, hsl(var(--accent) / .12) 100%)",
                border: "1px solid hsl(var(--border) / 1)"
              }}>
                <div className="fw-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Built for distribution speed
                </div>
                <div className="text-muted mt-1" style={{ lineHeight: 1.6 }}>
                  A dashboard that stays readable under pressure—clear tables, polished forms, and
                  consistent workflows that reduce mistakes.
                </div>

                <div className="mt-3 d-flex flex-column flex-sm-row gap-2">
                  <button
                    className="btn btn-primary pb-sheen"
                    onClick={() => window.location.href = "/signup"}
                    data-testid="landing-continue-bottom"
                  >
                    Get Started
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => window.location.href = "/login"}
                    data-testid="landing-signin-bottom"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <div className="text-muted small mt-4">
                © {new Date().getFullYear()} Pyramid Books • The Best Online Bookstore in Hyderabad • Secure sessions • Role-based access
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
