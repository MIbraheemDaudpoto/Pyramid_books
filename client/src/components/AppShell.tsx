import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Percent,
  Shield,
  Users,
  Receipt,
  Menu,
  Sparkles,
  Package,
  BarChart3,
  FileSpreadsheet,
  MessageCircle,
} from "lucide-react";
import type { Role } from "@shared/schema";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/utils";
import logoSrc from "@assets/pyramid-books-logo-official.jpg";

function roleLabel(role?: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "salesman":
      return "Sales";
    case "customer":
      return "Customer";
    default:
      return "User";
  }
}

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const a = (first?.[0] || "").toUpperCase();
  const b = (last?.[0] || "").toUpperCase();
  if (a || b) return `${a}${b}`;
  const e = (email || "").trim();
  return e ? e[0].toUpperCase() : "PB";
}

export default function AppShell(props: { children: React.ReactNode }) {
  const { data: me } = useMe();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = useMemo(() => {
    const r = me?.role;
    const base = [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard", show: !!me },
      { href: "/books", label: "Books", icon: BookOpen, testId: "nav-books", show: !!me },
      { href: "/customers", label: "Customers", icon: Users, testId: "nav-customers", show: !!me },
      { href: "/orders", label: "Orders", icon: Receipt, testId: "nav-orders", show: !!me },
      { href: "/payments", label: "Payments", icon: CreditCard, testId: "nav-payments", show: !!me },
      { href: "/stock", label: "Received Stock", icon: Package, testId: "nav-stock", show: r === "admin" || r === "salesman" },
      { href: "/messages", label: "Messages", icon: MessageCircle, testId: "nav-messages", show: !!me },
      { href: "/reports", label: "Reports", icon: BarChart3, testId: "nav-reports", show: r === "admin" || r === "salesman" },
      { href: "/csv", label: "Import / Export", icon: FileSpreadsheet, testId: "nav-csv", show: r === "admin" || r === "salesman" },
      { href: "/discounts", label: "Discounts", icon: Percent, testId: "nav-discounts", show: r === "admin" },
      { href: "/users", label: "Users", icon: Shield, testId: "nav-users", show: r === "admin" },
    ];
    return base.filter((x) => x.show);
  }, [me]);

  const topbar = (
    <div className="sticky-top">
      <div className="pb-glass border-bottom">
        <div className="container-fluid px-3 px-md-4 py-3">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary d-md-none d-inline-flex align-items-center gap-2"
                onClick={() => setMobileOpen(true)}
                data-testid="sidebar-open"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>

              <div className="d-none d-md-flex align-items-center gap-2">
                <img
                  src={logoSrc}
                  alt="Pyramid Books"
                  style={{ height: 40, objectFit: "contain" }}
                  data-testid="topbar-logo"
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              {!!me && (
                <div className="d-none d-sm-flex align-items-center gap-3">
                  <div className="text-end lh-1">
                    <div className="fw-semibold" data-testid="topbar-user-name">
                      {(me.firstName || me.lastName)
                        ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim()
                        : (me.email ?? "Account")}
                    </div>
                    <div className="text-muted small" data-testid="topbar-user-role">
                      {roleLabel(me.role)}
                      {!me.isActive ? " • Inactive" : ""}
                    </div>
                  </div>
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold"
                    style={{
                      width: 40,
                      height: 40,
                      background:
                        "radial-gradient(circle at 30% 25%, hsl(var(--accent)) 0%, hsl(var(--primary)) 70%)",
                      boxShadow: "var(--shadow-soft)",
                      overflow: "hidden",
                    }}
                    aria-label="User avatar"
                  >
                    {me.profileImageUrl ? (
                      <img
                        src={me.profileImageUrl}
                        alt="Profile"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span>{initials(me.firstName, me.lastName, me.email)}</span>
                    )}
                  </div>
                </div>
              )}

              {!!me && (
                <button
                  type="button"
                  className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                    window.location.href = "/";
                  }}
                  data-testid="logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="d-none d-sm-inline">Logout</span>
                </button>
              )}

              {!me && (
                <button
                  type="button"
                  className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
                  onClick={() => (window.location.href = "/login")}
                  data-testid="login"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Continue</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sidebar = (
    <div
      className="d-none d-md-flex flex-column"
      style={{
        width: 280,
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        background: "linear-gradient(180deg, hsl(var(--sidebar)) 0%, hsl(216 52% 8%) 100%)",
        borderRight: "1px solid hsl(var(--sidebar-border) / 1)",
      }}
    >
      <div className="p-4 pb-3">
        <div className="d-flex align-items-center gap-3">
          <img
            src={logoSrc}
            alt="Pyramid Books"
            style={{
              height: 40,
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
            data-testid="sidebar-logo"
          />
        </div>
      </div>

      <div className="px-3 pb-3">
        <div
          className="rounded-4 p-3"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05))",
            border: "1px solid rgba(255,255,255,.10)",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: 40,
                height: 40,
                background:
                  "radial-gradient(circle at 30% 25%, hsl(var(--sidebar-accent)) 0%, hsl(var(--sidebar-primary)) 70%)",
                overflow: "hidden",
              }}
              aria-label="User avatar"
            >
              {me?.profileImageUrl ? (
                <img
                  src={me.profileImageUrl}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{initials(me?.firstName, me?.lastName, me?.email)}</span>
              )}
            </div>
            <div className="flex-grow-1">
              <div className="text-white fw-semibold small text-truncate" data-testid="sidebar-user">
                {(me?.firstName || me?.lastName)
                  ? `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim()
                  : (me?.email ?? "Account")}
              </div>
              <div className="text-white-50 small">{roleLabel(me?.role)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 pb-4">
        {nav.map((item) => {
          const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "d-flex align-items-center gap-3 px-3 py-3 rounded-4 text-decoration-none mb-2",
                active ? "text-white" : "text-white-50",
              )}
              style={{
                background: active
                  ? "linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.06))"
                  : "transparent",
                border: active ? "1px solid rgba(255,255,255,.14)" : "1px solid transparent",
                transition: "all 220ms ease",
              }}
              data-testid={item.testId}
            >
              <div
                className="rounded-3 d-inline-flex align-items-center justify-content-center"
                style={{
                  width: 36,
                  height: 36,
                  background: active
                    ? "linear-gradient(135deg, hsl(var(--sidebar-primary)), hsl(var(--sidebar-accent)))"
                    : "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.10)",
                  transition: "all 220ms ease",
                }}
                aria-hidden="true"
              >
                <Icon className="text-white" style={{ width: 18, height: 18 }} />
              </div>
              <div className="fw-semibold">{item.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const mobileSidebar = (
    <>
      {mobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1040, background: "rgba(0,0,0,.35)" }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cn("position-fixed top-0 start-0 h-100", mobileOpen ? "translate-x-0" : "-translate-x-full")}
        style={{
          zIndex: 1045,
          width: 300,
          transition: "transform 260ms cubic-bezier(.2,.8,.2,1)",
          background: "linear-gradient(180deg, hsl(var(--sidebar)) 0%, hsl(216 52% 8%) 100%)",
          borderRight: "1px solid hsl(var(--sidebar-border) / 1)",
          padding: 16,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <img
              src={logoSrc}
              alt="Pyramid Books"
              style={{
                height: 36,
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={() => setMobileOpen(false)}
            data-testid="sidebar-close"
          >
            Close
          </button>
        </div>

        <div className="mb-3">
          <div className="text-white-50 small">Navigate</div>
        </div>

        <div>
          {nav.map((item) => {
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "d-flex align-items-center gap-3 px-3 py-3 rounded-4 text-decoration-none mb-2",
                  active ? "text-white" : "text-white-50",
                )}
                style={{
                  background: active
                    ? "linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.06))"
                    : "transparent",
                  border: active ? "1px solid rgba(255,255,255,.14)" : "1px solid transparent",
                  transition: "all 220ms ease",
                }}
                onClick={() => setMobileOpen(false)}
                data-testid={`${item.testId}-mobile`}
              >
                <Icon className="text-white" style={{ width: 18, height: 18 }} />
                <div className="fw-semibold">{item.label}</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-3">
          <button
            type="button"
            className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2 pb-sheen"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.href = "/";
            }}
            data-testid="logout-mobile"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-atmosphere">
      {topbar}
      {mobileSidebar}
      <div className="container-fluid px-0">
        <div className="d-flex">
          {sidebar}
          <main className="flex-grow-1">
            <div className="container-fluid px-3 px-md-4 px-lg-5 py-4 py-md-5">
              <div className="pb-enter">{props.children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
