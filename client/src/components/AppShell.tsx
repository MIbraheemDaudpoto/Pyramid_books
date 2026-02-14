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
import { useUnreadCount } from "@/hooks/use-messages";
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
  const { data: unreadCount = 0 } = useUnreadCount();
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
                        : me.email}
                    </div>
                    <div className="text-muted small">
                      {roleLabel(me.role)}
                    </div>
                  </div>
                  <div
                    className="avatar-orb shadow-sm"
                    style={{ width: 40, height: 40, fontSize: "1rem" }}
                    data-testid="topbar-avatar"
                  >
                    {initials(me.firstName, me.lastName, me.email)}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2 pb-sheen shadow-sm"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                    window.location.href = "/";
                  } catch (e) {
                    window.location.href = "/";
                  }
                }}
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sidebar = (
    <div
      className="d-none d-md-flex flex-column shrink-0 pb-side-column"
      style={{ width: 280 }}
    >
      <div className="p-4 vstack gap-2">
        {nav.map((item) => {
          const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "d-flex align-items-center gap-3 px-3 py-2.5 rounded-4 text-decoration-none cursor-pointer",
                  active ? "text-primary bg-primary bg-opacity-10" : "text-muted hover-bg-light",
                )}
                style={{
                  transition: "all 200ms ease",
                  border: active ? "1px solid var(--primary-border)" : "1px solid transparent",
                }}
                data-testid={item.testId}
                role="button"
              >
                <Icon
                  className={active ? "text-primary" : "text-muted"}
                  style={{ width: 18, height: 18 }}
                />
                <span className="fw-semibold flex-grow-1">{item.label}</span>
                {item.href === "/messages" && unreadCount > 0 && (
                  <span className="badge rounded-pill bg-danger shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-top mx-4">
        <div className="pb-glass rounded-4 p-3 d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="lh-sm">
            <div className="fw-bold small">Enterprise</div>
            <div className="text-muted" style={{ fontSize: "10px" }}>
              v1.2.0-stable
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const mobileSidebar = (
    <>
      <div
        className={cn(
          "fixed-top h-100 w-100 bg-dark bg-opacity-50 blur-sm transition-opacity z-1050",
          mobileOpen ? "opacity-100 active" : "opacity-0 invisible pointer-events-none",
        )}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "fixed-top h-100 bg-primary text-white p-4 shadow-lg transition-transform z-1060",
          mobileOpen ? "translate-x-0" : "translate-x-[-100%]",
        )}
        style={{
          width: 300,
          background: "linear-gradient(180deg, hsl(230 60% 12%), hsl(230 45% 18%))",
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

        <div className="vstack gap-2">
          {nav.map((item) => {
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "d-flex align-items-center gap-3 px-3 py-3 rounded-4 text-decoration-none",
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
                <span className="fw-semibold flex-grow-1">{item.label}</span>
                {item.href === "/messages" && unreadCount > 0 && (
                  <span className="badge rounded-pill bg-danger">
                    {unreadCount}
                  </span>
                )}
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
