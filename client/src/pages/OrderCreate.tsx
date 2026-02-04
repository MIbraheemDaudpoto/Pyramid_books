import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useBooks } from "@/hooks/use-books";
import { useCustomers } from "@/hooks/use-customers";
import { useCreateOrder } from "@/hooks/use-orders";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import type { CreateOrderRequest } from "@shared/schema";
import { BookOpen, Plus, Receipt, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";

const lineSchema = z.object({
  bookId: z.coerce.number(),
  qty: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  lineTotal: z.coerce.number().nonnegative(),
});

export default function OrderCreatePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: me } = useMe();

  const canCreate = me?.role === "super_admin" || me?.role === "salesman";

  const customersQuery = useCustomers();
  const booksQuery = useBooks();

  const createOrder = useCreateOrder();

  useEffect(() => {
    const msg =
      (customersQuery.error as Error | undefined)?.message ||
      (booksQuery.error as Error | undefined)?.message ||
      "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [customersQuery.error, booksQuery.error, toast]);

  const [customerId, setCustomerId] = useState<number | "">("");
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const [lines, setLines] = useState<Array<z.infer<typeof lineSchema>>>([]);

  const booksById = useMemo(() => {
    const m = new Map<number, (typeof booksQuery.data)[number]>();
    (booksQuery.data || []).forEach((b) => m.set(b.id, b));
    return m;
  }, [booksQuery.data]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + Number(l.lineTotal || 0), 0), [lines]);
  const total = useMemo(() => Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0)), [subtotal, discount, tax]);

  function addLine() {
    const first = booksQuery.data?.[0];
    if (!first) return;
    const unitPrice = Number(first.unitPrice || 0);
    setLines((prev) => [...prev, { bookId: first.id, qty: 1, unitPrice, lineTotal: unitPrice }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, patch: Partial<z.infer<typeof lineSchema>>) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const next = { ...l, ...patch };
        const qty = Number(next.qty || 0);
        const unitPrice = Number(next.unitPrice || 0);
        next.lineTotal = Math.max(0, qty * unitPrice);
        return next;
      }),
    );
  }

  function syncPriceFromBook(idx: number, bookId: number) {
    const book = booksById.get(bookId);
    const unitPrice = Number(book?.unitPrice || 0);
    updateLine(idx, { bookId, unitPrice });
  }

  async function submit() {
    if (!canCreate) {
      toast({ title: "Not allowed", description: "Your role cannot create orders.", variant: "destructive" });
      return;
    }
    if (!customerId) {
      toast({ title: "Customer required", description: "Select a customer before creating an order.", variant: "destructive" });
      return;
    }
    if (lines.length === 0) {
      toast({ title: "Add items", description: "Add at least one book line to the order.", variant: "destructive" });
      return;
    }
    const validatedLines = z.array(lineSchema).safeParse(lines);
    if (!validatedLines.success) {
      toast({ title: "Fix line items", description: validatedLines.error.errors[0]?.message ?? "Invalid items", variant: "destructive" });
      return;
    }

    const payload: CreateOrderRequest = {
      customerId: Number(customerId),
      items: validatedLines.data.map((l) => ({
        bookId: Number(l.bookId),
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice),
        lineTotal: Number(l.lineTotal),
      })),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      notes: notes || undefined,
    };

    createOrder.mutate(payload, {
      onSuccess: (order) => {
        toast({ title: "Order created", description: `Created #${order.orderNo}.` });
        setLocation(`/orders/${order.id}`);
      },
      onError: (e) => toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" }),
    });
  }

  return (
    <AppShell>
      <Seo title="New Order — Pyramid Books" description="Create a new order with line items, discounts, and tax." />

      <SectionHeader
        title="New Order"
        subtitle="Build the order carefully—prices and stock signals are here to keep you honest."
        right={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={() => setLocation("/orders")} data-testid="order-create-back">
              Back
            </button>
            <button
              className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
              onClick={submit}
              disabled={createOrder.isPending}
              data-testid="order-create-submit"
            >
              <Receipt className="w-4 h-4" />
              {createOrder.isPending ? "Creating…" : "Create order"}
            </button>
          </div>
        }
      />

      {!canCreate ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6 text-muted" />}
          title="Order creation is restricted"
          description="Your role does not allow creating orders. If you need access, ask an administrator."
          action={
            <button className="btn btn-outline-primary" onClick={() => setLocation("/orders")} data-testid="order-create-noaccess-back">
              Go to orders
            </button>
          }
          testId="order-create-noaccess"
        />
      ) : (
        <div className="row g-3 g-lg-4">
          <div className="col-12 col-lg-7">
            <GlassCard testId="order-create-lines">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <div>
                  <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                    Line items
                  </div>
                  <div className="text-muted small">Select books and set quantities.</div>
                </div>
                <button className="btn btn-outline-primary d-inline-flex align-items-center gap-2" onClick={addLine} data-testid="order-add-line">
                  <Plus className="w-4 h-4" />
                  Add line
                </button>
              </div>

              {booksQuery.isLoading ? (
                <div className="placeholder-glow">
                  <span className="placeholder col-12 rounded-3" style={{ height: 18, display: "block" }} />
                  <span className="placeholder col-10 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
                </div>
              ) : (booksQuery.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={<BookOpen className="w-6 h-6 text-muted" />}
                  title="No books available"
                  description="Add books to the catalog before creating an order."
                  action={
                    <button className="btn btn-outline-primary" onClick={() => setLocation("/books")} data-testid="order-create-go-books">
                      Go to books
                    </button>
                  }
                  testId="order-create-no-books"
                />
              ) : lines.length === 0 ? (
                <div className="text-muted py-4" data-testid="order-create-empty-lines">
                  No line items yet. Click “Add line” to start.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {lines.map((l, idx) => {
                    const book = booksById.get(Number(l.bookId));
                    const low = book ? Number(book.stockQty) <= Number(book.reorderLevel) : false;
                    return (
                      <div
                        key={`${idx}-${l.bookId}`}
                        className="rounded-4 p-3"
                        style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                        data-testid={`order-line-${idx}`}
                      >
                        <div className="row g-2 align-items-end">
                          <div className="col-12 col-md-6">
                            <label className="form-label small text-muted">Book</label>
                            <select
                              className="form-select"
                              value={l.bookId}
                              onChange={(e) => syncPriceFromBook(idx, Number(e.target.value))}
                              data-testid={`order-line-book-${idx}`}
                            >
                              {(booksQuery.data || []).map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.title} {b.isbn ? `• ${b.isbn}` : ""}
                                </option>
                              ))}
                            </select>
                            <div className="text-muted small mt-1">
                              {book?.author ?? "—"} • Stock{" "}
                              <span className={low ? "fw-semibold" : ""} style={{ color: low ? "hsl(var(--primary))" : undefined }}>
                                {book?.stockQty ?? "—"}
                              </span>
                              {low ? " (low)" : ""}
                            </div>
                          </div>

                          <div className="col-6 col-md-2">
                            <label className="form-label small text-muted">Qty</label>
                            <input
                              type="number"
                              className="form-control"
                              value={l.qty}
                              min={1}
                              onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })}
                              data-testid={`order-line-qty-${idx}`}
                            />
                          </div>

                          <div className="col-6 col-md-2">
                            <label className="form-label small text-muted">Unit price</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={l.unitPrice}
                              min={0}
                              onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })}
                              data-testid={`order-line-price-${idx}`}
                            />
                          </div>

                          <div className="col-8 col-md-2">
                            <label className="form-label small text-muted">Line total</label>
                            <input className="form-control" value={l.lineTotal.toFixed(2)} disabled data-testid={`order-line-total-${idx}`} />
                          </div>

                          <div className="col-4 col-md-12 d-flex justify-content-end">
                            <button
                              className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2"
                              onClick={() => removeLine(idx)}
                              data-testid={`order-line-remove-${idx}`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>

          <div className="col-12 col-lg-5">
            <GlassCard testId="order-create-summary">
              <div className="fw-bold mb-3" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                Summary
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted">Customer</label>
                {customersQuery.isLoading ? (
                  <div className="placeholder-glow">
                    <span className="placeholder col-12 rounded-3" style={{ height: 38, display: "block" }} />
                  </div>
                ) : (customersQuery.data?.length ?? 0) === 0 ? (
                  <EmptyState
                    icon={<Receipt className="w-6 h-6 text-muted" />}
                    title="No customers available"
                    description="Create a customer profile to create orders."
                    action={
                      <button className="btn btn-outline-primary" onClick={() => setLocation("/customers")} data-testid="order-create-go-customers">
                        Go to customers
                      </button>
                    }
                    testId="order-create-no-customers"
                  />
                ) : (
                  <select
                    className="form-select"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}
                    data-testid="order-customer"
                  >
                    <option value="">Select customer…</option>
                    {(customersQuery.data || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} • {c.customerType}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-muted">Discount</label>
                  <input type="number" step="0.01" className="form-control" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} data-testid="order-discount" />
                </div>
                <div className="col-6">
                  <label className="form-label small text-muted">Tax</label>
                  <input type="number" step="0.01" className="form-control" value={tax} onChange={(e) => setTax(Number(e.target.value))} data-testid="order-tax" />
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label small text-muted">Notes</label>
                <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="order-notes" />
              </div>

              <div className="mt-4 rounded-4 p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="text-muted">Subtotal</div>
                  <div className="fw-semibold">${subtotal.toFixed(2)}</div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <div className="text-muted">Discount</div>
                  <div className="fw-semibold">-${Number(discount || 0).toFixed(2)}</div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <div className="text-muted">Tax</div>
                  <div className="fw-semibold">${Number(tax || 0).toFixed(2)}</div>
                </div>
                <hr />
                <div className="d-flex align-items-center justify-content-between">
                  <div className="fw-bold" style={{ fontFamily: "var(--font-display)" }}>Total</div>
                  <div className="fw-bold" style={{ fontSize: 20 }} data-testid="order-total">
                    ${total.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary pb-sheen w-100 mt-3 d-inline-flex align-items-center justify-content-center gap-2"
                onClick={submit}
                disabled={createOrder.isPending}
                data-testid="order-create-submit-bottom"
              >
                <Receipt className="w-4 h-4" />
                {createOrder.isPending ? "Creating…" : "Create order"}
              </button>
            </GlassCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}
