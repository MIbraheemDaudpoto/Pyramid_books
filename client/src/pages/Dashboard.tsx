import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useDashboard } from "@/hooks/use-dashboard";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { Activity, BookOpen, CreditCard, PackageSearch, Receipt, Users } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "wouter";

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);
}

function KpiCard(props: { title: string; value: string; icon: React.ReactNode; hint?: string; tone?: "primary" | "accent" | "good" }) {
  const tone = props.tone ?? "primary";
  const color =
    tone === "primary" ? "hsl(var(--primary))" : tone === "accent" ? "hsl(var(--accent))" : "hsl(152 52% 42%)";

  return (
    <div
      className="rounded-4 p-3 p-md-4 h-100"
      style={{
        background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)",
        border: "1px solid hsl(var(--border) / 1)",
        boxShadow: "var(--shadow-soft)",
        transition: "transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease",
      }}
    >
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="flex-grow-1">
          <div className="text-muted small">{props.title}</div>
          <div className="mt-2 fw-bold" style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
            {props.value}
          </div>
          {props.hint && <div className="text-muted small mt-1">{props.hint}</div>}
        </div>
        <div
          className="rounded-4 d-inline-flex align-items-center justify-content-center"
          style={{
            width: 48,
            height: 48,
            background: `linear-gradient(135deg, ${color} 0%, rgba(255,255,255,.0) 140%)`,
            border: "1px solid hsl(var(--border) / 1)",
          }}
          aria-hidden="true"
        >
          <div style={{ color }}>{props.icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { data: me, isLoading: meLoading, error: meError } = useMe();
  const { data, isLoading, error } = useDashboard();

  useEffect(() => {
    const msg = (meError as Error | undefined)?.message || (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [meError, error, toast]);

  const greeting = useMemo(() => {
    if (!me) return "Welcome back";
    const name = (me.firstName || me.lastName) ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() : (me.email ?? "there");
    return `Welcome, ${name}`;
  }, [me]);

  return (
    <AppShell>
      <Seo title="Dashboard — Pyramid Books" description="Overview KPIs, recent orders, and quick actions." />

      <SectionHeader
        title={greeting}
        subtitle="A quick scan of stock, customers, orders, and cashflow—tailored by role."
        right={
          <div className="d-flex flex-wrap gap-2">
            <Link href="/orders" className="btn btn-outline-primary" data-testid="dashboard-go-orders">
              <Receipt className="w-4 h-4 me-2" />
              Orders
            </Link>
            <Link href="/books" className="btn btn-primary pb-sheen" data-testid="dashboard-go-books">
              <BookOpen className="w-4 h-4 me-2" />
              Books
            </Link>
          </div>
        }
      />

      <div className="row g-3 g-lg-4">
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Books in catalog"
            value={isLoading ? "—" : String(data?.kpis.booksCount ?? 0)}
            hint="Active titles tracked"
            icon={<BookOpen className="w-5 h-5" />}
            tone="accent"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Low stock alerts"
            value={isLoading ? "—" : String(data?.kpis.lowStockCount ?? 0)}
            hint="Below reorder level"
            icon={<PackageSearch className="w-5 h-5" />}
            tone="primary"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Customers"
            value={isLoading ? "—" : String(data?.kpis.customersCount ?? 0)}
            hint="Active accounts"
            icon={<Users className="w-5 h-5" />}
            tone="good"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Open orders"
            value={isLoading ? "—" : String(data?.kpis.openOrdersCount ?? 0)}
            hint="Draft/confirmed/shipped"
            icon={<Activity className="w-5 h-5" />}
            tone="accent"
          />
        </div>
      </div>

      <div className="row g-3 g-lg-4 mt-1">
        <div className="col-12 col-lg-7">
          <GlassCard testId="dashboard-recent-orders">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <div>
                <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                  Recent Orders
                </div>
                <div className="text-muted small">Latest activity on your desk.</div>
              </div>
              <Link href="/orders" className="btn btn-outline-primary btn-sm" data-testid="dashboard-view-all-orders">
                View all
              </Link>
            </div>

            {isLoading || meLoading ? (
              <div className="py-4">
                <div className="placeholder-glow mb-2">
                  <span className="placeholder col-12 rounded-3"></span>
                </div>
                <div className="placeholder-glow mb-2">
                  <span className="placeholder col-10 rounded-3"></span>
                </div>
                <div className="placeholder-glow">
                  <span className="placeholder col-11 rounded-3"></span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger mb-0" role="alert" data-testid="dashboard-error">
                {(error as Error).message}
              </div>
            ) : (data?.recentOrders?.length ?? 0) === 0 ? (
              <div className="text-muted py-4" data-testid="dashboard-empty">
                No recent orders yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="text-muted small">
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.recentOrders.slice(0, 8).map((o) => (
                      <tr key={o.id}>
                        <td className="fw-semibold">#{o.orderNo}</td>
                        <td>{o.customerName}</td>
                        <td>
                          <span
                            className="badge rounded-pill"
                            style={{
                              background:
                                o.status === "delivered"
                                  ? "hsl(152 52% 42% / .14)"
                                  : o.status === "cancelled"
                                    ? "hsl(var(--destructive) / .14)"
                                    : "hsl(var(--accent) / .14)",
                              color:
                                o.status === "delivered"
                                  ? "hsl(152 52% 42%)"
                                  : o.status === "cancelled"
                                    ? "hsl(var(--destructive))"
                                    : "hsl(var(--accent))",
                              border: "1px solid hsl(var(--border) / 1)",
                            }}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="text-end fw-semibold">{formatMoney(Number(o.total))}</td>
                        <td className="text-end">
                          <Link href={`/orders/${o.id}`} className="btn btn-sm btn-outline-primary" data-testid={`dashboard-open-order-${o.id}`}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="col-12 col-lg-5">
          <div className="row g-3">
            <div className="col-12">
              <GlassCard testId="dashboard-cashflow">
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                      30-day Cashflow
                    </div>
                    <div className="text-muted small">Sales vs payments recorded.</div>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-6">
                    <div className="rounded-4 p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <div className="text-muted small">Sales</div>
                      <div className="fw-bold mt-1" style={{ fontSize: 20 }}>
                        {isLoading ? "—" : formatMoney(Number(data?.kpis.sales30d ?? 0))}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="rounded-4 p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <div className="text-muted small">Payments</div>
                      <div className="fw-bold mt-1" style={{ fontSize: 20 }}>
                        {isLoading ? "—" : formatMoney(Number(data?.kpis.payments30d ?? 0))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-flex flex-wrap gap-2">
                  <Link href="/payments" className="btn btn-primary pb-sheen" data-testid="dashboard-record-payment">
                    <CreditCard className="w-4 h-4 me-2" />
                    Record payment
                  </Link>
                  <Link href="/orders/new" className="btn btn-outline-primary" data-testid="dashboard-create-order">
                    <Receipt className="w-4 h-4 me-2" />
                    New order
                  </Link>
                </div>
              </GlassCard>
            </div>

            <div className="col-12">
              <GlassCard testId="dashboard-role-card">
                <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                  Your access
                </div>
                <div className="text-muted mt-2" style={{ lineHeight: 1.6 }}>
                  {me?.role === "admin" && "Full system access: manage users, books, customers, orders, and payments."}
                  {me?.role === "salesman" && "Sales access: manage assigned customers, create orders, and record payments."}
                  {me?.role === "customer" && "Customer access: view your profile, orders, and payment history."}
                  {!me && "Sign in to see your access level."}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
