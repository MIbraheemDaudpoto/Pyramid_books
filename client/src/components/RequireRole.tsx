import { useMe } from "@/hooks/use-me";
import type { Role } from "@shared/schema";
import { Redirect, useLocation } from "wouter";

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function AccessDenied() {
  const [, setLocation] = useLocation();
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
      <div className="text-center">
        <div
          className="rounded-4 d-inline-flex align-items-center justify-content-center mx-auto mb-3"
          style={{
            width: 64,
            height: 64,
            background: "hsl(var(--destructive) / .12)",
            border: "1px solid hsl(var(--destructive) / .25)",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="hsl(var(--destructive))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h4 className="fw-bold mb-2">Access Denied</h4>
        <p className="text-muted mb-3">You don't have permission to view this page.</p>
        <button
          className="btn btn-primary pb-sheen"
          onClick={() => setLocation("/")}
          data-testid="access-denied-home"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

export default function RequireRole({ roles, children, fallback }: RequireRoleProps) {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!me) {
    return <Redirect to="/login" />;
  }

  if (!roles.includes(me.role as Role)) {
    if (me.role === "customer") {
      return <Redirect to="/store" />;
    }
    if (me.role === "admin" || me.role === "salesman") {
      return <Redirect to="/" />;
    }

    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  return <>{children}</>;
}
