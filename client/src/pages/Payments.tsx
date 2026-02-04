import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useCustomers } from "@/hooks/use-customers";
import { useOrders } from "@/hooks/use-orders";
import { useCreatePayment, usePayments } from "@/hooks/use-payments";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import type { CreatePaymentRequest } from "@shared/schema";
import { CreditCard, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";

function money(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
}

const paymentFormSchema = z.object({
  customerId: z.coerce.number().positive(),
  orderId: z.coerce.number().nullable().optional(),
  amount: z.coerce.number().positive(),
  method: z.string().min(1),
  referenceNo: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type PaymentFormState = z.infer<typeof paymentFormSchema>;

export default function PaymentsPage() {
  const { toast } = useToast();
  const { data: me } = useMe();
  const canCreate = me?.role === "super_admin" || me?.role === "salesman";

  const paymentsQuery = usePayments();
  const customersQuery = useCustomers();
  const ordersQuery = useOrders();

  useEffect(() => {
    const msg =
      (paymentsQuery.error as Error | undefined)?.message ||
      (customersQuery.error as Error | undefined)?.message ||
      (ordersQuery.error as Error | undefined)?.message ||
      "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [paymentsQuery.error, customersQuery.error, ordersQuery.error, toast]);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const list = paymentsQuery.data || [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((p) => (p.customerName || "").toLowerCase().includes(s) || (p.method || "").toLowerCase().includes(s) || String(p.referenceNo || "").toLowerCase().includes(s));
  }, [paymentsQuery.data, q]);

  const createPayment = useCreatePayment();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<PaymentFormState>({
    customerId: 0,
    orderId: null,
    amount: 0,
    method: "cash",
    referenceNo: "",
    notes: "",
  });

  function openCreate() {
    setForm({
      customerId: customersQuery.data?.[0]?.id ?? 0,
      orderId: null,
      amount: 0,
      method: "cash",
      referenceNo: "",
      notes: "",
    });
    setCreateOpen(true);
  }

  function submitCreate() {
    const parsed = paymentFormSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Fix the form", description: parsed.error.errors[0]?.message ?? "Invalid input", variant: "destructive" });
      return;
    }
    const payload: CreatePaymentRequest = {
      customerId: parsed.data.customerId,
      orderId: parsed.data.orderId ?? null,
      amount: parsed.data.amount,
      method: parsed.data.method,
      referenceNo: parsed.data.referenceNo || undefined,
      notes: parsed.data.notes || undefined,
    };
    createPayment.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Payment recorded", description: "Payment entry saved." });
        setCreateOpen(false);
      },
      onError: (e) => toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" }),
    });
  }

  return (
    <AppShell>
      <Seo title="Payments — Pyramid Books" description="Record and review payments by customer and order." />

      <SectionHeader
        title="Payments"
        subtitle={canCreate ? "Record payments with method, reference, and notes." : "Your payment history."}
        right={
          canCreate ? (
            <button className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2" onClick={openCreate} data-testid="payments-create">
              <Plus className="w-4 h-4" />
              Record payment
            </button>
          ) : (
            <button className="btn btn-outline-primary" onClick={() => window.location.reload()} data-testid="payments-refresh">
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
          <input className="form-control" placeholder="Customer, method, reference…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="payments-search" />
          <button className="btn btn-outline-primary" onClick={() => setQ("")} data-testid="payments-clear-search">
            Clear
          </button>
        </div>
      </GlassCard>

      <div className="mt-4">
        {paymentsQuery.isLoading ? (
          <GlassCard>
            <div className="placeholder-glow">
              <span className="placeholder col-12 rounded-3" style={{ height: 18, display: "block" }} />
              <span className="placeholder col-10 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
              <span className="placeholder col-11 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
            </div>
          </GlassCard>
        ) : paymentsQuery.error ? (
          <div className="alert alert-danger" role="alert" data-testid="payments-error">
            {(paymentsQuery.error as Error).message}
          </div>
        ) : (filtered.length ?? 0) === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-6 h-6 text-muted" />}
            title="No payments found"
            description={canCreate ? "Record your first payment to start tracking cashflow." : "No payments are visible for your account yet."}
            action={
              canCreate ? (
                <button className="btn btn-primary pb-sheen" onClick={openCreate} data-testid="payments-empty-create">
                  Record payment
                </button>
              ) : (
                <button className="btn btn-outline-primary" onClick={() => window.location.reload()} data-testid="payments-empty-refresh">
                  Refresh
                </button>
              )
            }
            testId="payments-empty"
          />
        ) : (
          <GlassCard testId="payments-table">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th>Customer</th>
                    <th className="d-none d-lg-table-cell">Order</th>
                    <th>Method</th>
                    <th className="d-none d-md-table-cell">Reference</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="fw-semibold">{p.customerName}</div>
                        <div className="text-muted small">{p.receivedByName ? `Received by ${p.receivedByName}` : "—"}</div>
                      </td>
                      <td className="d-none d-lg-table-cell">{p.orderId ? `#${p.orderId}` : "—"}</td>
                      <td>
                        <span className="badge rounded-pill text-bg-light border">{p.method}</span>
                      </td>
                      <td className="d-none d-md-table-cell">{p.referenceNo ?? "—"}</td>
                      <td className="text-end fw-semibold">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl" data-testid="payments-create-dialog">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Customer</label>
              <select
                className="form-select"
                value={form.customerId}
                onChange={(e) => setForm((p) => ({ ...p, customerId: Number(e.target.value) }))}
                data-testid="payment-form-customer"
              >
                {(customersQuery.data || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Order (optional)</label>
              <select
                className="form-select"
                value={form.orderId ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value ? Number(e.target.value) : null }))}
                data-testid="payment-form-order"
              >
                <option value="">No order</option>
                {(ordersQuery.data || []).map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.orderNo} — {o.customerName} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                data-testid="payment-form-amount"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Method</label>
              <select
                className="form-select"
                value={form.method}
                onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
                data-testid="payment-form-method"
              >
                <option value="cash">cash</option>
                <option value="bank">bank</option>
                <option value="card">card</option>
                <option value="mobile_money">mobile_money</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Reference no</label>
              <input
                className="form-control"
                value={form.referenceNo ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, referenceNo: e.target.value }))}
                data-testid="payment-form-reference"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} data-testid="payment-form-notes" />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-1">
              <button className="btn btn-outline-primary" onClick={() => setCreateOpen(false)} data-testid="payment-form-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen" onClick={submitCreate} disabled={createPayment.isPending} data-testid="payment-form-submit">
                {createPayment.isPending ? "Saving…" : "Save payment"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
