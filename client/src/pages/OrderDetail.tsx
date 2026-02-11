import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useOrder, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, PackageCheck, PackageSearch, Truck, XCircle, ClipboardCheck, Receipt, Download, Pencil, Trash2, Check, X } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

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

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: number; qty: number }) => {
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
              <>
                <button
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                  onClick={() => generateInvoicePDF(data)}
                  data-testid="download-invoice-btn"
                >
                  <Download className="w-4 h-4" />
                  Invoice
                </button>
                <button
                  className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
                  onClick={() => setStatus(nextStatus)}
                  disabled={statusMutation.isPending}
                  data-testid="order-status-apply"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {statusMutation.isPending ? "Updating…" : `Set ${nextStatus}`}
                </button>
              </>
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
                      <th className="text-end" style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it) => (
                      <tr key={it.id} data-testid={`order-item-row-${it.id}`}>
                        <td>
                          <div className="fw-semibold">{it.book.title}</div>
                          <div className="text-muted small">
                            {it.book.author ?? "—"} {it.book.isbn ? `• ${it.book.isbn}` : ""}
                          </div>
                        </td>
                        <td className="text-end">
                          {editingItemId === it.id ? (
                            <input
                              type="number"
                              min={1}
                              className="form-control form-control-sm text-end"
                              style={{ width: 70, display: "inline-block" }}
                              value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              data-testid={`order-item-qty-input-${it.id}`}
                            />
                          ) : (
                            it.qty
                          )}
                        </td>
                        <td className="text-end fw-semibold">{money(it.unitPrice)}</td>
                        <td className="text-end fw-semibold">{money(it.lineTotal)}</td>
                        <td className="text-end">
                          {editingItemId === it.id ? (
                            <div className="d-inline-flex gap-1">
                              <button
                                className="btn btn-sm btn-outline-success d-inline-flex align-items-center"
                                onClick={confirmEdit}
                                disabled={updateItemMutation.isPending}
                                data-testid={`order-item-save-${it.id}`}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                                onClick={() => setEditingItemId(null)}
                                data-testid={`order-item-cancel-${it.id}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="d-inline-flex gap-1">
                              <button
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
                                onClick={() => startEdit(it.id, it.qty)}
                                data-testid={`order-item-edit-${it.id}`}
                                title="Edit quantity"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                onClick={() => askDeleteItem(it.id)}
                                disabled={data.items.length <= 1}
                                data-testid={`order-item-delete-${it.id}`}
                                title={data.items.length <= 1 ? "Cannot remove last item" : "Remove item"}
                              >
                                <Trash2 className="w-3 h-3" />
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

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remove Order Item"
        description="Are you sure you want to remove this item from the order? The stock will be restored."
        onConfirm={confirmDelete}
        isPending={deleteItemMutation.isPending}
      />
    </AppShell>
  );
}
