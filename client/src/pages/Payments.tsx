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
import { CreditCard, Plus, Search, User, Hash, Wallet, FileText, CheckCircle2, XCircle, ChevronRight, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";
import { formatCurrency, cn } from "@/lib/utils";

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
  const canCreate = me?.role === "admin" || me?.role === "salesman";

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
      toast({ title: "Validation Error", description: parsed.error.errors[0]?.message ?? "Please check your input.", variant: "destructive" });
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
        toast({ title: "Transaction processed", description: "The payment has been successfully recorded." });
        setCreateOpen(false);
      },
      onError: (e) => toast({ title: "Transaction failed", description: (e as Error).message, variant: "destructive" }),
    });
  }

  return (
    <AppShell>
      <Seo title="Payments & Collections — Pyramid Books" description="Manage customer payments and financial settlements." />

      <SectionHeader
        title="Financial Ledger"
        subtitle={canCreate ? "Track incoming payments and manage customer account settlements." : "Review your transaction history and account receipts."}
        right={
          canCreate ? (
            <button className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2 shadow-sm" onClick={openCreate} data-testid="payments-create">
              <Plus className="w-4 h-4" />
              Collect Payment
            </button>
          ) : (
            <button className="btn btn-outline-primary shadow-sm" onClick={() => window.location.reload()} data-testid="payments-refresh">
              Refresh Data
            </button>
          )
        }
      />

      <GlassCard className="border-0 shadow-sm p-4 mb-4">
        <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Filter Transactions</label>
        <div className="input-group input-group-lg shadow-none border rounded-4 overflow-hidden">
          <span className="input-group-text bg-light border-0">
            <Search className="w-5 h-5 text-muted" />
          </span>
          <input
            className="form-control border-0 bg-light p-3 fs-6 h-auto"
            placeholder="Search by customer name, method, or reference…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="payments-search"
          />
          {q && (
            <button className="btn btn-light border-0 px-3" onClick={() => setQ("")} data-testid="payments-clear-search">
              <XCircle className="w-4 h-4 text-muted" />
            </button>
          )}
        </div>
      </GlassCard>

      <div className="mt-4">
        {paymentsQuery.isLoading ? (
          <div className="vstack gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <GlassCard key={i} className="border-0 shadow-sm p-3">
                <div className="placeholder-glow">
                  <span className="placeholder col-12 rounded-3 h-12" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : paymentsQuery.error ? (
          <div className="alert alert-danger border-0 rounded-4 p-4 shadow-sm" role="alert" data-testid="payments-error">
            <div className="d-flex align-items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span className="fw-bold">Failed to load ledger:</span>
              {(paymentsQuery.error as Error).message}
            </div>
          </div>
        ) : (filtered.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Wallet className="w-12 h-12 text-muted opacity-20" />}
            title="No transactions found"
            description={canCreate ? "No payments match your current search criteria. Record a new payment to get started." : "You don't have any payment history yet."}
            action={
              canCreate ? (
                <button className="btn btn-primary pb-sheen rounded-pill px-4 fw-bold" onClick={openCreate} data-testid="payments-empty-create">
                  Collect First Payment
                </button>
              ) : (
                <button className="btn btn-outline-primary rounded-pill px-4 fw-bold" onClick={() => window.location.reload()} data-testid="payments-empty-refresh">
                  Sync Ledger
                </button>
              )
            }
            testId="payments-empty"
          />
        ) : (
          <GlassCard testId="payments-table" className="border-0 shadow-sm overflow-hidden p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small border-0">
                    <th className="px-4 py-3 border-0 text-uppercase fw-bold"><User className="w-3 h-3 me-1" /> Payee</th>
                    <th className="py-3 border-0 text-uppercase fw-bold d-none d-lg-table-cell"><Hash className="w-3 h-3 me-1" /> Linked Order</th>
                    <th className="py-3 border-0 text-uppercase fw-bold"><Wallet className="w-3 h-3 me-1" /> Method</th>
                    <th className="py-3 border-0 text-uppercase fw-bold d-none d-md-table-cell">Reference</th>
                    <th className="py-3 border-0 text-uppercase fw-bold text-end">Grand Total</th>
                    <th className="px-4 py-3 border-0"></th>
                  </tr>
                </thead>
                <tbody className="border-0">
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-0">
                      <td className="px-4 py-4 border-bottom-0">
                        <div className="fw-black text-dark" style={{ fontSize: '1.05rem' }}>{p.customerName}</div>
                        <div className="text-muted small d-flex align-items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          {p.receivedByName ? `Verified by ${p.receivedByName}` : "Recorded"}
                        </div>
                      </td>
                      <td className="py-4 border-bottom-0 d-none d-lg-table-cell">
                        {p.orderId ? (
                          <span className="badge bg-primary-subtle text-primary border-primary-subtle fw-black">#{p.orderId}</span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td className="py-4 border-bottom-0">
                        <span className="badge rounded-pill bg-light text-dark border px-3 py-1.5 fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>
                          {p.method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 border-bottom-0 d-none d-md-table-cell">
                        <div className="text-muted font-monospace small">{p.referenceNo ?? "—"}</div>
                      </td>
                      <td className="py-4 border-bottom-0 text-end">
                        <div className="fw-black text-dark" style={{ fontSize: '1.25rem' }}>{formatCurrency(p.amount)}</div>
                      </td>
                      <td className="px-4 py-4 border-bottom-0 text-end">
                        <button className="btn btn-sm btn-icon btn-ghost-primary rounded-circle">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-0 shadow-lg rounded-4 p-0 overflow-hidden" style={{ maxWidth: 640 }}>
          <div className="bg-primary p-4 text-white">
            <DialogHeader>
              <DialogTitle className="fw-black text-white h4 mb-1">Process Collection</DialogTitle>
              <p className="text-white-50 small mb-0">Securely log customer payments and settle accounts.</p>
            </DialogHeader>
          </div>

          <div className="p-4 bg-white vstack gap-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Customer Source</label>
                <select
                  className="form-select border-0 bg-light p-3 rounded-4 shadow-none fw-bold"
                  value={form.customerId}
                  onChange={(e) => setForm((p) => ({ ...p, customerId: Number(e.target.value) }))}
                  data-testid="payment-form-customer"
                >
                  <option value={0} disabled>Select a customer…</option>
                  {(customersQuery.data || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Linked Order (Optional)</label>
                <select
                  className="form-select border-0 bg-light p-3 rounded-4 shadow-none fw-bold"
                  value={form.orderId ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value ? Number(e.target.value) : null }))}
                  data-testid="payment-form-order"
                >
                  <option value="">Stand-alone Payment</option>
                  {(ordersQuery.data || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.orderNo} ({formatCurrency(o.total)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Amount</label>
                <div className="input-group input-group-lg border rounded-4 overflow-hidden shadow-none">
                  <span className="input-group-text bg-light border-0"><DollarSign className="w-4 h-4 text-muted" /></span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control border-0 bg-light p-3 fw-black"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                    data-testid="payment-form-amount"
                  />
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Method</label>
                <select
                  className="form-select border-0 bg-light p-3 rounded-4 shadow-none fw-bold h-100"
                  value={form.method}
                  onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
                  data-testid="payment-form-method"
                >
                  <option value="cash">Cash Settlement</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="mobile_money">Mobile Payment</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Reference #</label>
                <input
                  className="form-control border-0 bg-light p-3 rounded-4 shadow-none fw-bold font-monospace h-100"
                  value={form.referenceNo ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, referenceNo: e.target.value }))}
                  placeholder="TRX-XXXXXX"
                  data-testid="payment-form-reference"
                />
              </div>

              <div className="col-12">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Notes & Documentation</label>
                <textarea
                  className="form-control border-0 bg-light p-3 rounded-4 shadow-none"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Additional transaction details or verification notes…"
                  data-testid="payment-form-notes"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 mt-4">
              <button className="btn btn-outline-secondary rounded-pill px-4 fw-bold" onClick={() => setCreateOpen(false)} data-testid="payment-form-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen rounded-pill px-5 fw-bold shadow-sm" onClick={submitCreate} disabled={createPayment.isPending} data-testid="payment-form-submit">
                {createPayment.isPending ? "Processing…" : "Verify & Save Payment"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function DollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
