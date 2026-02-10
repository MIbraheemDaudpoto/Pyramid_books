import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useOrders } from "@/hooks/use-orders";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { Plus, Receipt, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

function formatMoney(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
}

export default function OrdersListPage() {
  const { toast } = useToast();
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
    return list.filter((o) => String(o.orderNo).toLowerCase().includes(s) || (o.customerName || "").toLowerCase().includes(s) || String(o.status).toLowerCase().includes(s));
  }, [data, q]);

  return (
    <AppShell>
      <Seo title="Orders — Pyramid Books" description="Create and track orders through fulfillment statuses." />

      <SectionHeader
        title="Orders"
        subtitle="Track every shipment: draft → confirmed → shipped → delivered."
        right={
          canCreate ? (
            <Link href="/orders/new" className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2" data-testid="orders-new">
              <Plus className="w-4 h-4" />
              New order
            </Link>
          ) : (
            <button className="btn btn-outline-primary" onClick={() => window.location.reload()} data-testid="orders-refresh">
              Refresh
            </button>
          )
        }
      />

      <GlassCard>
        <label className="form-label small text-muted">Search</label>
        <div className="input-group">
          <span className="input-group-text bg-transparent" style={{ borderColor: "hsl(var(--input))" }}>
            <Search className="w-4 h-4" />
          </span>
          <input className="form-control" placeholder="Order no, customer, status…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="orders-search" />
          <button className="btn btn-outline-primary" onClick={() => setQ("")} data-testid="orders-clear-search">
            Clear
          </button>
        </div>
      </GlassCard>

      <div className="mt-4">
        {isLoading ? (
          <GlassCard>
            <div className="placeholder-glow">
              <span className="placeholder col-12 rounded-3" style={{ height: 18, display: "block" }} />
              <span className="placeholder col-10 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
              <span className="placeholder col-11 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
            </div>
          </GlassCard>
        ) : error ? (
          <div className="alert alert-danger" role="alert" data-testid="orders-error">
            {(error as Error).message}
          </div>
        ) : (filtered.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6 text-muted" />}
            title="No orders found"
            description={canCreate ? "Create your first order to start the workflow." : "No orders are visible for your account yet."}
            action={
              canCreate ? (
                <Link href="/orders/new" className="btn btn-primary pb-sheen" data-testid="orders-empty-new">
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
          <GlassCard testId="orders-table">
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
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td className="fw-semibold">#{o.orderNo}</td>
                      <td>{o.customerName}</td>
                      <td>
                        <span className="badge rounded-pill text-bg-light border">{o.status}</span>
                      </td>
                      <td className="text-end fw-semibold">{formatMoney(o.total)}</td>
                      <td className="text-end">
                        <Link href={`/orders/${o.id}`} className="btn btn-sm btn-outline-primary" data-testid={`orders-open-${o.id}`}>
                          Open
                        </Link>
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
