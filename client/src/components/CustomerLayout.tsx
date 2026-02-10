import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  BookOpen,
  Boxes,
  LogOut,
  ShoppingCart,
  Receipt,
  CreditCard,
  User,
  Menu,
  X,
} from "lucide-react";
import type { Role } from "@shared/schema";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/utils";
import { useCartCount } from "@/hooks/use-cart";

function roleLabel(role?: Role) {
  switch (role) {
    case "fixed_customer":
      return "Fixed Customer";
    case "local_customer":
      return "Local Customer";
    default:
      return "Customer";
  }
}

export default function CustomerLayout(props: { children: React.ReactNode }) {
  const { data: me } = useMe();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartCount();

  const nav = [
    { href: "/store", label: "Browse Books", icon: BookOpen, testId: "nav-store" },
    { href: "/store/cart", label: "Shopping Cart", icon: ShoppingCart, testId: "nav-cart", badge: cartCount },
    { href: "/store/orders", label: "My Orders", icon: Receipt, testId: "nav-my-orders" },
    { href: "/store/payments", label: "My Payments", icon: CreditCard, testId: "nav-my-payments", show: me?.role === "fixed_customer" },
    { href: "/store/profile", label: "My Account", icon: User, testId: "nav-my-profile" },
  ].filter((x) => x.show !== false);

  return (
    <div className="app-atmosphere" style={{ minHeight: "100vh" }}>
      <div className="sticky-top" style={{ zIndex: 1030 }}>
        <div
          className="border-bottom"
          style={{
            background: "linear-gradient(180deg, hsl(var(--sidebar)) 0%, hsl(210 29% 14%) 100%)",
            borderColor: "hsl(var(--sidebar-border) / 1)",
          }}
        >
          <div className="container-fluid px-3 px-md-4 py-2">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light d-md-none"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  data-testid="customer-menu-toggle"
                >
                  {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
                <Link href="/store" className="d-flex align-items-center gap-2 text-decoration-none">
                  <div
                    className="rounded-3 d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: 36,
                      height: 36,
                      background: "linear-gradient(135deg, hsl(var(--sidebar-primary)) 0%, hsl(var(--sidebar-accent)) 90%)",
                    }}
                  >
                    <Boxes className="text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="text-white fw-bold d-none d-sm-block" style={{ fontFamily: "var(--font-display)" }}>
                    Pyramid Books
                  </div>
                </Link>
              </div>

              <div className="d-none d-md-flex align-items-center gap-1">
                {nav.map((item) => {
                  const active = item.href === "/store"
                    ? location === "/store"
                    : location.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "btn btn-sm d-inline-flex align-items-center gap-2 position-relative",
                        active ? "btn-primary" : "btn-outline-light border-0",
                      )}
                      data-testid={item.testId}
                    >
                      <Icon style={{ width: 16, height: 16 }} />
                      <span>{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          className="badge rounded-pill bg-danger position-absolute"
                          style={{ top: -4, right: -6, fontSize: 10 }}
                          data-testid="cart-badge"
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="d-flex align-items-center gap-2">
                <Link
                  href="/store/cart"
                  className="btn btn-sm btn-outline-light d-md-none position-relative"
                  data-testid="nav-cart-mobile"
                >
                  <ShoppingCart style={{ width: 16, height: 16 }} />
                  {cartCount > 0 && (
                    <span
                      className="badge rounded-pill bg-danger position-absolute"
                      style={{ top: -4, right: -6, fontSize: 10 }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>

                {me && (
                  <div className="d-none d-sm-flex align-items-center gap-2">
                    <div className="text-end lh-1">
                      <div className="text-white small fw-semibold" data-testid="customer-name">
                        {(me.firstName || me.lastName)
                          ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim()
                          : (me.email ?? "Account")}
                      </div>
                      <div className="text-white-50 small">{roleLabel(me.role)}</div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1"
                  onClick={() => (window.location.href = "/api/logout")}
                  data-testid="customer-logout"
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                  <span className="d-none d-sm-inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div
            style={{
              background: "hsl(var(--sidebar))",
              borderBottom: "1px solid hsl(var(--sidebar-border) / 1)",
            }}
          >
            <div className="container-fluid px-3 py-2 d-flex flex-column gap-1">
              {nav.map((item) => {
                const active = item.href === "/store"
                  ? location === "/store"
                  : location.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "btn btn-sm d-flex align-items-center gap-2 text-start",
                      active ? "btn-primary" : "btn-outline-light border-0",
                    )}
                    onClick={() => setMobileOpen(false)}
                    data-testid={`${item.testId}-mobile`}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                    <span>{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="badge rounded-pill bg-danger ms-auto">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="container-fluid px-3 px-md-4 px-lg-5 py-4">
        <div className="pb-enter">{props.children}</div>
      </div>
    </div>
  );
}
