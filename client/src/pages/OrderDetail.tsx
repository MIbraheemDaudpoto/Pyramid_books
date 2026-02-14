import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useOrder, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, PackageCheck, PackageSearch, Truck, XCircle, ClipboardCheck, Receipt, Download, Pencil, Trash2, Check, X, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { formatCurrency, cn } from "@/lib/utils";

const statuses = ["draft", "confirmed", "shipped", "delivered", "finalized", "cancelled"] as const;

const statusConfig: Record<string, { color: string; icon: any; tone: { bg: string; fg: string } }> = {
  draft: { color: "bg-secondary", icon: Pencil, tone: { bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" } },
  confirmed: { color: "bg-info", icon: Check, tone: { bg: "hsl(var(--accent) / .14)", fg: "hsl(var(--accent))" } },
  shipped: { color: "bg-primary", icon: Truck, tone: { bg: "hsl(var(--primary) / .14)", fg: "hsl(var(--primary))" } },
  delivered: { color: "bg-success", icon: PackageCheck, tone: { bg: "hsl(152 52% 42% / .14)", fg: "hsl(152 52% 42%)" } },
  finalized: { color: "bg-primary-dark", icon: CheckSquare, tone: { bg: "hsl(210 60% 45% / .14)", fg: "hsl(210 60% 45%)" } },
  cancelled: { color: "bg-danger", icon: XCircle, tone: { bg: "hsl(var(--destructive) / .14)", fg: "hsl(var(--destructive))" } },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span
      className="badge rounded-pill d-inline-flex align-items-center gap-1 px-3 py-2 border shadow-sm"
      style={{ background: config.tone.bg, color: config.tone.fg, borderColor: "hsl(var(--border))" }}
      data-testid="order-status-badge"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{status}</span>
    </span>
  );
}

export default function OrderDetailPage(props: { params?: { id?: string } }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, routeParams] = useRoute("/orders/:id");

  const params = props.params || routeParams;
  const idStr = params?.id;
  const id = Number(idStr);

  const { data, isLoading, error } = useOrder(id);
  const statusMutation = useUpdateOrderStatus();

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) {
      redirectToLogin(toast);
    }
  }, [error, toast]);

  const [nextStatus, setNextStatus] = useState<string>("confirmed");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  useEffect(() => {
    if (data?.status) {
      const currentIndex = statuses.indexOf(data.status as any);
      if (currentIndex !== -1 && currentIndex < statuses.length - 1) {
        setNextStatus(statuses[currentIndex + 1]);
      }
    }
  }, [data]);

  function setStatus(status: string) {
    if (!id || isNaN(id)) return;
    statusMutation.mutate(
      { id, status: status as any },
      {
        onSuccess: () => toast({ title: "Status updated", description: `Order is now ${status}.` }),
        onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: number; qty: number }) => {
      if (!id || isNaN(id)) throw new Error("Invalid Order ID");
      const res = await apiRequest("PATCH", `/api/orders/${id}/items/${itemId}`, { qty });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      setEditingItemId(null);
      toast({ title: "Item updated", description: "Quantity has been updated." });
    },
    onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!id || isNaN(id)) throw new Error("Invalid Order ID");
      const res = await apiRequest("DELETE", `/api/orders/${id}/items/${itemId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      setConfirmDeleteOpen(false);
      setDeletingItemId(null);
      toast({ title: "Item removed", description: "Order item has been removed." });
    },
    onError: (e) => toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" }),
  });

  function startEdit(itemId: number, currentQty: number) {
    setEditingItemId(itemId);
    setEditQty(currentQty);
  }

  function confirmEdit() {
    if (editingItemId === null) return;
    updateItemMutation.mutate({ itemId: editingItemId, qty: editQty });
  }

  function askDeleteItem(itemId: number) {
    setDeletingItemId(itemId);
    setConfirmDeleteOpen(true);
  }

  function confirmDelete() {
    if (deletingItemId === null) return;
    deleteItemMutation.mutate(deletingItemId);
  }

  return (
    <AppShell>
      <Seo title={data ? `Order #${data.orderNo} — Pyramid Books` : "Order Detail — Pyramid Books"} description="Order detail view with items, totals, and status updates." />

      <SectionHeader
        title={data ? `Order #${data.orderNo}` : (isNaN(id) ? "Invalid Order" : "Order detail")}
        subtitle={data ? (
          <div className="d-flex align-items-center gap-2">
            <span className="fw-medium text-dark">{data.customer?.name || "Unknown Customer"}</span>
            <span className="text-muted">•</span>
            <span className="text-muted">Created by: {data.createdBy?.email ?? data.createdBy?.id ?? "System"}</span>
          </div>
        ) : (isNaN(id) ? "The provided order ID is invalid." : "Loading order…")}
        right={
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-primary border-2 d-inline-flex align-items-center gap-2" onClick={() => setLocation("/orders")} data-testid="order-detail-back">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {data && (
              <button
                className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2 px-4 shadow-sm"
                onClick={() => generateInvoicePDF(data)}
                data-testid="download-invoice-btn"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            )}
          </div>
        }
      />

      {isNaN(id) ? (
        <GlassCard>
          <div className="text-center py-5">
            <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4 opacity-20" />
            <h5 className="fw-bold">Invalid Order ID</h5>
            <p className="text-muted mb-4">The order ID in the URL is missing or not a number.</p>
            <button className="btn btn-primary shadow-sm" onClick={() => setLocation("/orders")}>
              Back to Orders
            </button>
          </div>
        </GlassCard>
      ) : isLoading ? (
        <div className="vstack gap-4">
          <GlassCard>
            <div className="placeholder-glow">
              <div className="placeholder col-4 rounded-3 mb-3" style={{ height: 24 }} />
              <div className="placeholder col-12 rounded-3" style={{ height: 100 }} />
            </div>
          </GlassCard>
        </div>
      ) : error ? (
        <GlassCard className="border-danger/20">
          <div className="text-center py-5">
            <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4 opacity-20" />
            <h5 className="fw-bold text-danger">Error Loading Order</h5>
            <p className="text-muted mb-4">{(error as Error).message}</p>
            <button className="btn btn-danger px-4" onClick={() => window.location.reload()}>
              Retry Loading
            </button>
          </div>
        </GlassCard>
      ) : !data ? (
        <GlassCard>
          <div className="text-center py-5">
            <PackageSearch className="w-16 h-16 text-muted mx-auto mb-4 opacity-20" />
            <h5 className="fw-bold">Order Not Found</h5>
            <p className="text-muted mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <button className="btn btn-primary shadow-sm" onClick={() => setLocation("/orders")}>
              Back to Orders
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <GlassCard testId="order-items" className="overflow-hidden border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 px-4 py-3 d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-0">Order Items</h6>
                  <p className="text-muted small mb-0">Books included in this order</p>
                </div>
                <StatusBadge status={data.status} />
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr className="text-muted small border-0">
                      <th className="px-4 py-3 border-0 text-uppercase fw-bold">Book Title</th>
                      <th className="py-3 border-0 text-uppercase fw-bold text-end" style={{ width: 100 }}>Qty</th>
                      <th className="py-3 border-0 text-uppercase fw-bold text-end">Unit Price</th>
                      <th className="py-3 border-0 text-uppercase fw-bold text-end">Line Total</th>
                      <th className="px-4 py-3 border-0 text-uppercase fw-bold text-end" style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="border-0">
                    {data.items?.map((it) => (
                      <tr key={it.id} data-testid={`order-item-row-${it.id}`} className="border-bottom-0">
                        <td className="px-4 py-3">
                          <div className="fw-bold text-dark">{it.book?.title || "Unknown Book"}</div>
                          <div className="text-muted small">
                            {it.book?.author ?? "—"} {it.book?.isbn ? `• ISBN: ${it.book.isbn}` : ""}
                          </div>
                        </td>
                        <td className="py-3 text-end">
                          {editingItemId === it.id ? (
                            <input
                              type="number"
                              min={1}
                              className="form-control form-control-sm text-end ms-auto"
                              style={{ width: 70 }}
                              value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              data-testid={`order-item-qty-input-${it.id}`}
                              autoFocus
                            />
                          ) : (
                            <span className="badge bg-light text-dark border fw-normal">{it.qty}</span>
                          )}
                        </td>
                        <td className="py-3 text-end fw-medium">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-3 text-end fw-bold text-primary">{formatCurrency(it.lineTotal)}</td>
                        <td className="px-4 py-3 text-end">
                          {editingItemId === it.id ? (
                            <div className="d-inline-flex gap-1">
                              <button
                                className="btn btn-sm btn-success d-inline-flex align-items-center p-1"
                                onClick={confirmEdit}
                                disabled={updateItemMutation.isPending}
                                data-testid={`order-item-save-${it.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center p-1"
                                onClick={() => setEditingItemId(null)}
                                data-testid={`order-item-cancel-${it.id}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="d-inline-flex gap-1">
                              <button
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center p-1 border-0"
                                onClick={() => startEdit(it.id, it.qty)}
                                data-testid={`order-item-edit-${it.id}`}
                                title="Edit quantity"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center p-1 border-0"
                                onClick={() => askDeleteItem(it.id)}
                                disabled={(data.items?.length || 0) <= 1}
                                data-testid={`order-item-delete-${it.id}`}
                                title={(data.items?.length || 0) <= 1 ? "Cannot remove last item" : "Remove item"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.notes && (
                <div className="m-4 p-4 bg-light rounded-4 border-start border-4 border-primary">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-2 small text-uppercase">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Internal Order Notes</span>
                  </div>
                  <div className="text-secondary">{data.notes}</div>
                </div>
              )}
            </GlassCard>
          </div>

          <div className="col-12 col-lg-4">
            <div className="vstack gap-4">
              <GlassCard testId="order-status" className="border-0 shadow-sm">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Status Management
                </h6>
                <p className="text-muted small mb-4">Advance the order through the fulfillment pipeline.</p>

                <div className="mb-4">
                  <label className="form-label small text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem' }}>Next State</label>
                  <div className="input-group">
                    <select
                      className="form-select border-2"
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      data-testid="order-status-select"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary px-3 shadow-none"
                      onClick={() => setStatus(nextStatus)}
                      disabled={statusMutation.isPending || data.status === nextStatus}
                      data-testid="order-status-apply"
                    >
                      {statusMutation.isPending ? <span className="spinner-border spinner-border-sm" /> : "Apply"}
                    </button>
                  </div>
                </div>

                <div className="vstack gap-2">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-info flex-fill d-inline-flex align-items-center justify-content-center gap-2 border-2 fw-medium"
                      onClick={() => setStatus("confirmed")}
                      disabled={statusMutation.isPending || data.status === "confirmed"}
                    >
                      <Check className="w-4 h-4" />
                      Confirm
                    </button>
                    <button
                      className="btn btn-outline-primary flex-fill d-inline-flex align-items-center justify-content-center gap-2 border-2 fw-medium"
                      onClick={() => setStatus("shipped")}
                      disabled={statusMutation.isPending || data.status === "shipped"}
                    >
                      <Truck className="w-4 h-4" />
                      Ship
                    </button>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-success flex-fill d-inline-flex align-items-center justify-content-center gap-2 border-2 fw-medium"
                      onClick={() => setStatus("delivered")}
                      disabled={statusMutation.isPending || data.status === "delivered"}
                    >
                      <PackageCheck className="w-4 h-4" />
                      Deliver
                    </button>
                    <button
                      className="btn btn-outline-danger flex-fill d-inline-flex align-items-center justify-content-center gap-2 border-2 fw-medium"
                      onClick={() => setStatus("cancelled")}
                      disabled={statusMutation.isPending || data.status === "cancelled"}
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <button
                    className="btn btn-success w-100 d-inline-flex align-items-center justify-content-center gap-2 py-3 rounded-4 fw-bold shadow-sm"
                    onClick={() => setStatus("finalized")}
                    disabled={statusMutation.isPending || data.status === "finalized"}
                    data-testid="order-status-finalized"
                  >
                    <CheckSquare className="w-5 h-5" />
                    {data.status === "finalized" ? "Invoice Finalized" : "Finalize & Lock Invoice"}
                  </button>
                </div>
              </GlassCard>

              <GlassCard className="border-0 shadow-sm overflow-hidden p-0">
                <div className="px-4 py-3 bg-light border-bottom">
                  <h6 className="fw-bold mb-0">Financial Summary</h6>
                </div>
                <div className="p-4 vstack gap-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="fw-semibold">{formatCurrency(data.subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Total Discount</span>
                    <span className="fw-bold text-success">-{formatCurrency(data.discount)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">VAT / Sales Tax</span>
                    <span className="fw-semibold">{formatCurrency(data.tax)}</span>
                  </div>
                  <div className="my-1 border-top border-dashed"></div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="fw-bold fs-5 text-dark">Grand Total</div>
                    <div className="fw-bold fs-3 text-primary" data-testid="order-total" style={{ letterSpacing: '-0.5px' }}>
                      {formatCurrency(data.total)}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-light border-top d-flex align-items-center gap-2 text-muted small">
                  <Receipt className="w-4 h-4" />
                  <span>Reference ID: {data.id}</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remove Order Item"
        description="Are you sure you want to remove this item? This action will adjust the stock and cannot be undone."
        onConfirm={confirmDelete}
        destructive
      />
    </AppShell>
  );
}
