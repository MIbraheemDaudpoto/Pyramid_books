import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useOrder, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { ArrowLeft, PackageCheck, PackageSearch, Truck, XCircle, ClipboardCheck, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";

function money(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
}

const statuses = ["draft", "confirmed", "shipped", "delivered", "cancelled"] as const;

function statusBadge(status: string) {
  const tone =
    status === "delivered"
      ? { bg: "hsl(152 52% 42% / .14)", fg: "hsl(152 52% 42%)" }
      : status === "cancelled"
        ? { bg: "hsl(var(--destructive) / .14)", fg: "hsl(var(--destructive))" }
        : status === "confirmed"
          ? { bg: "hsl(var(--accent) / .14)", fg: "hsl(var(--accent))" }
          : status === "shipped"
            ? { bg: "hsl(var(--primary) / .14)", fg: "hsl(var(--primary))" }
            : { bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" };

  return (
    <span
      className="badge rounded-pill"
      style={{ background: tone.bg, color: tone.fg, border: "1px solid hsl(var(--border))" }}
      data-testid="order-status-badge"
    >
      {status}
    </span>
  );
}

export default function OrderDetailPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/orders/:id");
  const id = Number(params?.id);

  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useOrder(id);
  const statusMutation = useUpdateOrderStatus();

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  const [nextStatus, setNextStatus] = useState<string>("confirmed");

  const allowedNext = useMemo(() => {
    if (!data) return statuses;
    return statuses;
  }, [data]);

  function setStatus(status: string) {
    statusMutation.mutate(
      { id, status },
      {
        onSuccess: () => toast({ title: "Status updated", description: `Order is now ${status}.` }),
        onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  return (
    <AppShell>
      <Seo title={`Order #${id} — Pyramid Books`} description="Order detail view with items, totals, and status updates." />

      <SectionHeader
        title={data ? `Order #${data.orderNo}` : "Order detail"}
        subtitle={data ? `Customer: ${data.customer.name} • Created by: ${data.createdBy.email ?? data.createdBy.id}` : "Loading order…"}
        right={
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-primary d-inline-flex align-items-center gap-2" onClick={() => setLocation("/orders")} data-testid="order-detail-back">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {data && (
              <button
                className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
                onClick={() => setStatus(nextStatus)}
                disabled={statusMutation.isPending}
                data-testid="order-status-apply"
              >
                <ClipboardCheck className="w-4 h-4" />
                {statusMutation.isPending ? "Updating…" : `Set ${nextStatus}`}
              </button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <GlassCard>
          <div className="placeholder-glow">
            <span className="placeholder col-12 rounded-3" style={{ height: 18, display: "block" }} />
            <span className="placeholder col-10 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
            <span className="placeholder col-11 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
          </div>
        </GlassCard>
      ) : error ? (
        <div className="alert alert-danger" role="alert" data-testid="order-detail-error">
          {(error as Error).message}
        </div>
      ) : !data ? (
        <div className="alert alert-warning" role="alert" data-testid="order-detail-notfound">
          Order not found.
        </div>
      ) : (
        <div className="row g-3 g-lg-4">
          <div className="col-12 col-lg-8">
            <GlassCard testId="order-items">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <div>
                  <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                    Items
                  </div>
                  <div className="text-muted small">Books included in this order.</div>
                </div>
                <div>{statusBadge(data.status)}</div>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="text-muted small">
                      <th>Book</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Unit</th>
                      <th className="text-end">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div className="fw-semibold">{it.book.title}</div>
                          <div className="text-muted small">
                            {it.book.author ?? "—"} {it.book.isbn ? `• ${it.book.isbn}` : ""}
                          </div>
                        </td>
                        <td className="text-end">{it.qty}</td>
                        <td className="text-end fw-semibold">{money(it.unitPrice)}</td>
                        <td className="text-end fw-semibold">{money(it.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.notes && (
                <div className="mt-3 rounded-4 p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <div className="text-muted small">Notes</div>
                  <div className="mt-1">{data.notes}</div>
                </div>
              )}
            </GlassCard>
          </div>

          <div className="col-12 col-lg-4">
            <GlassCard testId="order-status">
              <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                Status workflow
              </div>
              <div className="text-muted mt-1" style={{ lineHeight: 1.6 }}>
                Update order status as it moves through the pipeline.
              </div>

              <div className="mt-3">
                <label className="form-label small text-muted">Set status</label>
                <select
                  className="form-select"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  data-testid="order-status-select"
                >
                  {allowedNext.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 d-flex flex-wrap gap-2">
                <button
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                  onClick={() => setStatus("confirmed")}
                  disabled={statusMutation.isPending}
                  data-testid="order-status-confirmed"
                >
                  <PackageSearch className="w-4 h-4" />
                  Confirm
                </button>
                <button
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                  onClick={() => setStatus("shipped")}
                  disabled={statusMutation.isPending}
                  data-testid="order-status-shipped"
                >
                  <Truck className="w-4 h-4" />
                  Shipped
                </button>
                <button
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                  onClick={() => setStatus("delivered")}
                  disabled={statusMutation.isPending}
                  data-testid="order-status-delivered"
                >
                  <PackageCheck className="w-4 h-4" />
                  Delivered
                </button>
                <button
                  className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
                  onClick={() => setStatus("cancelled")}
                  disabled={statusMutation.isPending}
                  data-testid="order-status-cancelled"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </div>

              <div className="mt-4 rounded-4 p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="text-muted">Subtotal</div>
                  <div className="fw-semibold">{money(data.subtotal)}</div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <div className="text-muted">Discount</div>
                  <div className="fw-semibold">-{money(data.discount)}</div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <div className="text-muted">Tax</div>
                  <div className="fw-semibold">{money(data.tax)}</div>
                </div>
                <hr />
                <div className="d-flex align-items-center justify-content-between">
                  <div className="fw-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Total
                  </div>
                  <div className="fw-bold" style={{ fontSize: 20 }} data-testid="order-total">
                    {money(data.total)}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-muted small d-flex align-items-center gap-2">
                <Receipt className="w-4 h-4" />
                Order ID {data.id}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}
