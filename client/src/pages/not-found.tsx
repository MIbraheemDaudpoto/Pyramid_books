import { Link } from "wouter";
import Seo from "@/components/Seo";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="app-atmosphere" style={{ minHeight: "100vh" }}>
      <Seo title="404 — Pyramid Books" description="Page not found." />
      <div className="container px-4 py-5">
        <div
          className="pb-glass rounded-5 p-4 p-md-5 mx-auto"
          style={{ maxWidth: 760, boxShadow: "var(--shadow-lift)" }}
        >
          <div className="d-flex align-items-start gap-3">
            <div
              className="rounded-4 d-inline-flex align-items-center justify-content-center"
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, hsl(var(--primary) / .16), hsl(var(--accent) / .14))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <FileQuestion className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="flex-grow-1">
              <h1 className="m-0" style={{ fontSize: "clamp(1.8rem, 1.2rem + 1.4vw, 2.6rem)" }}>
                Page not found
              </h1>
              <p className="text-muted mt-2 mb-0" style={{ lineHeight: 1.7 }}>
                The page you’re looking for doesn’t exist—or you don’t have access to it.
              </p>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link href="/" className="btn btn-primary pb-sheen" data-testid="notfound-home">
                  Go to dashboard
                </Link>
                <button className="btn btn-outline-primary" onClick={() => window.history.back()} data-testid="notfound-back">
                  Go back
                </button>
              </div>
            </div>
          </div>

          <div className="text-muted small mt-4">Pyramid Books • Distribution Console</div>
        </div>
      </div>
    </div>
  );
}
