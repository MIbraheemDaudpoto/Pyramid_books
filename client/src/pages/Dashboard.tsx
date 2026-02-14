import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useDashboard } from "@/hooks/use-dashboard";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { Activity, BookOpen, CreditCard, PackageSearch, Receipt, Users, ArrowRight, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { formatCurrency, cn } from "@/lib/utils";

const statusConfig: Record<string, { tone: { bg: string; fg: string } }> = {
  pending: { tone: { bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" } },
  draft: { tone: { bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" } },
  confirmed: { tone: { bg: "hsl(var(--accent) / .14)", fg: "hsl(var(--accent))" } },
  shipped: { tone: { bg: "hsl(var(--primary) / .14)", fg: "hsl(var(--primary))" } },
  delivered: { tone: { bg: "hsl(152 52% 42% / .14)", fg: "hsl(152 52% 42%)" } },
  finalized: { tone: { bg: "hsl(210 60% 45% / .14)", fg: "hsl(210 60% 45%)" } },
  cancelled: { tone: { bg: "hsl(var(--destructive) / .14)", fg: "hsl(var(--destructive))" } },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className="badge rounded-pill d-inline-flex align-items-center px-2 py-1 border"
      style={{ background: config.tone.bg, color: config.tone.fg, borderColor: "hsl(var(--border))", fontSize: '0.65rem' }}
    >
      <span className="text-uppercase fw-bold" style={{ letterSpacing: '0.3px' }}>{status}</span>
    </span>
  );
}

function KpiCard({ title, value, icon, hint, tone = "primary" }: { title: string; value: string; icon: React.ReactNode; hint?: string; tone?: "primary" | "accent" | "good" }) {
  const color = tone === "primary" ? "hsl(var(--primary))" : tone === "accent" ? "hsl(var(--accent))" : "hsl(152 52% 42%)";
  const bg = tone === "primary" ? "hsl(var(--primary) / 0.05)" : tone === "accent" ? "hsl(var(--accent) / 0.05)" : "hsl(152 52% 42% / 0.05)";

  return (
    <GlassCard className="h-100 border-0 shadow-sm p-4 group hover:translate-y-[-2px] transition-all duration-300">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <div className="text-muted small fw-medium mb-1">{title}</div>
          <div className="fw-black text-dark leading-tight" style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>
            {value}
          </div>
          {hint && (
            <div className="d-flex align-items-center gap-1 mt-2 text-muted small">
              <TrendingUp className="w-3 h-3 text-success" />
              <span>{hint}</span>
            </div>
          )}
        </div>
        <div
          className="rounded-4 d-flex align-items-center justify-content-center shrink-0"
          style={{
            width: '52px',
            height: '52px',
            background: bg,
            color: color,
            border: `1px solid ${color}20`
          }}
        >
          {icon}
        </div>
      </div>
    </GlassCard>
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
    return `Welcome back, ${name}`;
  }, [me]);

  return (
    <AppShell>
      <Seo title="Dashboard — Pyramid Books" description="Overview KPIs, recent orders, and quick actions." />

      <SectionHeader
        title={greeting}
        subtitle="Here's a quick glimpse of your business activity and key performance indicators."
        right={
          <div className="d-flex flex-wrap gap-2">
            <Link href="/orders" className="btn btn-outline-primary shadow-sm" data-testid="dashboard-go-orders">
              <Receipt className="w-4 h-4 me-2" />
              Manage Orders
            </Link>
            <Link href="/books" className="btn btn-primary pb-sheen shadow-sm" data-testid="dashboard-go-books">
              <BookOpen className="w-4 h-4 me-2" />
              Update Catalog
            </Link>
          </div>
        }
      />

      <div className="row g-4 mt-1">
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Total Catalog"
            value={isLoading ? "—" : String(data?.kpis.booksCount ?? 0)}
            hint="Active listings"
            icon={<BookOpen className="w-6 h-6" />}
            tone="accent"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Short Inventory"
            value={isLoading ? "—" : String(data?.kpis.lowStockCount ?? 0)}
            hint="Requires attention"
            icon={<PackageSearch className="w-6 h-6" />}
            tone="primary"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Registered Users"
            value={isLoading ? "—" : String(data?.kpis.customersCount ?? 0)}
            hint="Customer base"
            icon={<Users className="w-6 h-6" />}
            tone="good"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard
            title="Pending Orders"
            value={isLoading ? "—" : String(data?.kpis.openOrdersCount ?? 0)}
            hint="In-progress"
            icon={<Activity className="w-6 h-6" />}
            tone="accent"
          />
        </div>
      </div>

      <div className="row g-4 mt-4">
        <div className="col-12 col-lg-8">
          <GlassCard testId="dashboard-recent-orders" className="border-0 shadow-sm overflow-hidden p-0">
            <div className="p-4 d-flex align-items-center justify-content-between border-bottom">
              <div>
                <h5 className="fw-black text-dark mb-1">Recent Activity</h5>
                <p className="text-muted small mb-0">The latest orders processed through the system.</p>
              </div>
              <Link href="/orders" className="btn btn-sm btn-ghost-primary rounded-pill px-3" data-testid="dashboard-view-all-orders">
                View All Activity <ArrowRight className="w-3.5 h-3.5 ms-1" />
              </Link>
            </div>

            {isLoading || meLoading ? (
              <div className="p-4 vstack gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="placeholder-glow">
                    <div className="placeholder col-12 rounded-3 h-10" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="alert alert-danger mb-0 rounded-4 border-0" role="alert" data-testid="dashboard-error">
                  {(error as Error).message}
                </div>
              </div>
            ) : (data?.recentOrders?.length ?? 0) === 0 ? (
              <div className="p-5 text-center" data-testid="dashboard-empty">
                <Clock className="w-12 h-12 text-muted opacity-20 mx-auto mb-3" />
                <h6 className="text-muted fw-bold">No recent activity</h6>
                <p className="text-muted small">New orders will appear here as they are created.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr className="text-muted small border-0">
                      <th className="px-4 py-3 border-0 text-uppercase fw-bold">Order ID</th>
                      <th className="py-3 border-0 text-uppercase fw-bold">Customer</th>
                      <th className="py-3 border-0 text-uppercase fw-bold">Status</th>
                      <th className="py-3 border-0 text-uppercase fw-bold text-end">Grand Total</th>
                      <th className="px-4 py-3 border-0 text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="border-0">
                    {data!.recentOrders.slice(0, 8).map((o) => (
                      <tr key={o.id} className="border-0">
                        <td className="px-4 py-3 border-bottom-0 fw-bold text-dark">#{o.orderNo}</td>
                        <td className="py-3 border-bottom-0 text-muted">{o.customerName}</td>
                        <td className="py-3 border-bottom-0">
                          <StatusBadge status={o.status ?? "pending"} />
                        </td>
                        <td className="py-3 border-bottom-0 text-end fw-bold text-dark">
                          {formatCurrency(o.total)}
                        </td>
                        <td className="px-4 py-3 border-bottom-0 text-end">
                          <Link href={`/orders/${o.id}`} className="btn btn-sm btn-icon btn-ghost-primary rounded-circle" data-testid={`dashboard-open-order-${o.id}`}>
                            <ArrowRight className="w-4 h-4" />
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

        <div className="col-12 col-lg-4">
          <div className="vstack gap-4 sticky-top" style={{ top: '2rem' }}>
            <GlassCard testId="dashboard-cashflow" className="border-0 shadow-sm p-4">
              <h5 className="fw-black text-dark mb-1">Financial Pulse</h5>
              <p className="text-muted small mb-4">Activity from the last 30 days.</p>

              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-4 border">
                    <div className="text-muted small fw-medium">Gross Sales</div>
                    <div className="fw-black text-dark mt-1" style={{ fontSize: '1.25rem' }}>
                      {isLoading ? "—" : formatCurrency(data?.kpis.sales30d ?? 0)}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-4 border text-end">
                    <div className="text-muted small fw-medium">Recovered</div>
                    <div className="fw-black text-success mt-1" style={{ fontSize: '1.25rem' }}>
                      {isLoading ? "—" : formatCurrency(data?.kpis.payments30d ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="vstack gap-2 mt-4">
                <Link href="/payments" className="btn btn-primary pb-sheen w-100 py-2.5 fw-bold shadow-sm" data-testid="dashboard-record-payment">
                  <CreditCard className="w-4 h-4 me-2" />
                  Record New Payment
                </Link>
                <Link href="/orders/new" className="btn btn-outline-primary w-100 py-2.5 fw-bold" data-testid="dashboard-create-order">
                  <Receipt className="w-4 h-4 me-2" />
                  Create Manual Order
                </Link>
              </div>
            </GlassCard>

            <GlassCard testId="dashboard-role-card" className="border-0 shadow-sm p-4 bg-primary text-white overflow-hidden position-relative">
              <div className="position-absolute top-0 end-0 p-3 opacity-10">
                <Users className="w-24 h-24" />
              </div>
              <h6 className="text-white-50 text-uppercase fw-black small mb-2" style={{ letterSpacing: '1px' }}>System Role</h6>
              <h4 className="fw-black mb-3">
                {me?.role === "admin" ? "Administrator" : me?.role === "salesman" ? "Sales Representative" : "Customer Portal"}
              </h4>
              <p className="mb-0 opacity-75 small leading-relaxed">
                {me?.role === "admin" && "Complete oversight of inventory, financial data, and user management modules."}
                {me?.role === "salesman" && "Focus on customer relationship management, order generation, and payment tracking."}
                {me?.role === "customer" && "Secure gateway to view personal purchase history and manage account settlements."}
                {!me && "Authentication required to access system modules."}
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
