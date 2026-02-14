import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useOrders } from "@/hooks/use-orders";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { Plus, Receipt, Search, FileText, Calendar, User, ArrowRight, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { formatCurrency, cn } from "@/lib/utils";

const statusConfig: Record<string, { tone: { bg: string; fg: string }; icon: any }> = {
  draft: { tone: { bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" }, icon: Clock },
  confirmed: { tone: { bg: "hsl(var(--accent) / .14)", fg: "hsl(var(--accent))" }, icon: FileText },
  shipped: { tone: { bg: "hsl(var(--primary) / .14)", fg: "hsl(var(--primary))" }, icon: Truck },
  delivered: { tone: { bg: "hsl(152 52% 42% / .14)", fg: "hsl(152 52% 42%)" }, icon: Package },
  finalized: { tone: { bg: "hsl(210 60% 45% / .14)", fg: "hsl(210 60% 45%)" }, icon: CheckCircle },
  cancelled: { tone: { bg: "hsl(var(--destructive) / .14)", fg: "hsl(var(--destructive))" }, icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  return (
    <span
      className="badge rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1.5 border"
      style={{ background: config.tone.bg, color: config.tone.fg, borderColor: "hsl(var(--border))" }}
    >
      <Icon className="w-3 h-3" />
      <span className="text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.3px' }}>{status}</span>
    </span>
  );
}

export default function OrdersListPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: me } = useMe();
  const canCreate = me?.role === "admin" || me?.role === "salesman";

  const { data, isLoading, error } = useOrders();
  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const list = data || [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((o) =>
      String(o.orderNo).toLowerCase().includes(s) ||
      (o.customerName || "").toLowerCase().includes(s) ||
      String(o.status).toLowerCase().includes(s)
    );
  }, [data, q]);

  return (
    <AppShell>
      <Seo title="Orders — Pyramid Books" description="Create and track orders through fulfillment statuses." />

      <SectionHeader
        title="Orders"
        subtitle="Track every shipment: draft → confirmed → shipped → delivered."
        right={
          canCreate && (
            <Link href="/orders/new" className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2 px-4 shadow-sm" data-testid="orders-new">
              <Plus className="w-4 h-4" />
              New order
            </Link>
          )
        }
      />

      <GlassCard className="border-0 shadow-sm p-3">
        <div className="input-group input-group-lg bg-light rounded-4 overflow-hidden border-0">
          <span className="input-group-text bg-transparent border-0 ps-3">
            <Search className="w-5 h-5 text-muted" />
          </span>
          <input
            className="form-control border-0 bg-transparent py-3 shadow-none fw-medium"
            placeholder="Search by order #, customer name, or status…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="orders-search"
          />
          {q && (
            <button className="btn btn-link text-muted pe-3 text-decoration-none" onClick={() => setQ("")} data-testid="orders-clear-search">
              Clear
            </button>
          )}
        </div>
      </GlassCard>

      <div className="mt-4">
        {isLoading ? (
          <GlassCard>
            <div className="placeholder-glow vstack gap-3">
              <div className="placeholder col-12 rounded-3" style={{ height: 60 }} />
              <div className="placeholder col-12 rounded-3" style={{ height: 60 }} />
              <div className="placeholder col-12 rounded-3" style={{ height: 60 }} />
            </div>
          </GlassCard>
        ) : error ? (
          <GlassCard className="border-danger/20 text-center py-5">
            <XCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-20" />
            <h5 className="fw-bold text-danger">Error Loading Orders</h5>
            <p className="text-secondary">{(error as Error).message}</p>
            <button className="btn btn-outline-danger mt-2" onClick={() => window.location.reload()}>Retry</button>
          </GlassCard>
        ) : (filtered.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Receipt className="w-12 h-12 text-muted opacity-20" />}
            title="No orders found"
            description={canCreate ? "Create your first order to start the workflow." : "No orders are visible for your account yet."}
            action={
              canCreate ? (
                <Link href="/orders/new" className="btn btn-primary pb-sheen px-4 py-2" data-testid="orders-empty-new">
                  New order
                </Link>
              ) : (
                <button className="btn btn-outline-primary" onClick={() => window.location.reload()} data-testid="orders-empty-refresh">
                  Refresh
                </button>
              )
            }
            testId="orders-empty"
          />
        ) : (
          <GlassCard testId="orders-table" className="border-0 shadow-sm overflow-hidden p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small border-0">
                    <th className="px-4 py-3 border-0 text-uppercase fw-bold" style={{ width: '150px' }}>Order</th>
                    <th className="py-3 border-0 text-uppercase fw-bold">Customer</th>
                    <th className="py-3 border-0 text-uppercase fw-bold">Status</th>
                    <th className="py-3 border-0 text-uppercase fw-bold text-end">Total</th>
                    <th className="px-4 py-3 border-0 text-uppercase fw-bold text-end" style={{ width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody className="border-0">
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-0" style={{ cursor: 'pointer' }} onClick={() => setLocation(`/orders/${o.id}`)}>
                      <td className="px-4 py-3 border-bottom-0">
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="fw-bold text-dark d-block">#{o.orderNo}</span>
                            <span className="text-muted small d-flex align-items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 border-bottom-0">
                        <div className="d-flex align-items-center gap-2 text-dark fw-medium">
                          <User className="w-4 h-4 text-muted" />
                          {o.customerName}
                        </div>
                      </td>
                      <td className="py-3 border-bottom-0">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3 border-bottom-0 text-end">
                        <span className="fw-bold text-primary">{formatCurrency(o.total)}</span>
                      </td>
                      <td className="px-4 py-3 border-bottom-0 text-end">
                        <div className="btn btn-sm btn-icon btn-ghost-primary rounded-circle">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
