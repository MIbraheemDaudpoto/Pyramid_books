import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useStockReceipts, useCreateStockReceipt } from "@/hooks/use-stock-receipts";
import { useBooks } from "@/hooks/use-books";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { Package, Plus, Trash2, Calendar, User, FileText, ChevronRight, Hash, Tag, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";

function fmtDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface ReceiptItem {
  bookId: number;
  qty: number;
  buyingPrice: string;
  companyDiscount: string;
}

export default function StockReceiptsPage() {
  const { toast } = useToast();
  const { data: me } = useMe();
  const canManage = me?.role === "admin" || me?.role === "salesman";

  const { data: receipts, isLoading, error } = useStockReceipts();
  const { data: booksData } = useBooks();
  const createMutation = useCreateStockReceipt();

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  const [createOpen, setCreateOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
  const [publisher, setPublisher] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([{ bookId: 0, qty: 1, buyingPrice: "", companyDiscount: "" }]);

  function resetForm() {
    setPublisher("");
    setNotes("");
    setItems([{ bookId: 0, qty: 1, buyingPrice: "", companyDiscount: "" }]);
  }

  function addItem() {
    setItems([...items, { bookId: 0, qty: 1, buyingPrice: "", companyDiscount: "" }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ReceiptItem, value: string | number) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!publisher.trim()) {
      toast({ title: "Validation Error", description: "Publisher name is required.", variant: "destructive" });
      return;
    }
    const validItems = items.filter((i) => i.bookId > 0 && i.qty > 0);
    if (validItems.length === 0) {
      toast({ title: "Validation Error", description: "Add at least one valid book item.", variant: "destructive" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        publisher: publisher.trim(),
        items: validItems.map((i) => ({
          bookId: i.bookId,
          qty: i.qty,
          buyingPrice: i.buyingPrice || "0",
          companyDiscount: i.companyDiscount || "0",
        })),
        notes: notes.trim() || undefined,
      });
      toast({ title: "Inbound stock recorded", description: "The inventory has been successfully updated." });
      setCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "System Error", description: err.message || "Failed to finalize stock receipt.", variant: "destructive" });
    }
  }

  if (!me) return null;

  return (
    <AppShell>
      <Seo title="Stock Receipts — Pyramid Books" description="Manage and track inventory shipments from publishers." />

      <SectionHeader
        title="Inventory Inbound"
        subtitle="Manage and track stock shipments received from publishers and suppliers."
        testId="header-stock-receipts"
        right={
          canManage && (
            <button
              type="button"
              className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2 shadow-sm"
              onClick={() => { resetForm(); setCreateOpen(true); }}
              data-testid="button-create-receipt"
            >
              <Plus className="w-4 h-4" />
              Record New Shipment
            </button>
          )
        }
      />

      <GlassCard testId="stock-receipts-table-card" className="border-0 shadow-sm overflow-hidden p-0">
        {isLoading ? (
          <div className="p-5 vstack gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="placeholder-glow"><div className="placeholder col-12 rounded-3 h-12" /></div>
            ))}
          </div>
        ) : !receipts || receipts.length === 0 ? (
          <div className="text-center py-5 vstack align-items-center" data-testid="empty-stock-receipts">
            <div className="p-4 bg-light rounded-circle mb-3">
              <Package className="text-muted opacity-40" style={{ width: 48, height: 48 }} />
            </div>
            <h5 className="fw-bold text-dark">No shipments logged</h5>
            <p className="text-muted small max-w-sm">When you record incoming stock from publishers, it will be listed here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="stock-receipts-table">
              <thead className="bg-light">
                <tr className="text-muted small border-0">
                  <th className="px-4 py-3 border-0 text-uppercase fw-bold"><Hash className="w-3 h-3 me-1" /> Receipt</th>
                  <th className="py-3 border-0 text-uppercase fw-bold"><Building2 className="w-3 h-3 me-1" /> Source</th>
                  <th className="py-3 border-0 text-uppercase fw-bold">Contents</th>
                  <th className="py-3 border-0 text-uppercase fw-bold">Total Qty</th>
                  <th className="py-3 border-0 text-uppercase fw-bold">Receiver</th>
                  <th className="py-3 border-0 text-uppercase fw-bold">Status Date</th>
                  <th className="px-4 py-3 border-0"></th>
                </tr>
              </thead>
              <tbody className="border-0">
                {receipts.map((r) => (
                  <tr
                    key={r.id}
                    data-testid={`stock-receipt-row-${r.id}`}
                    className="border-0 cursor-pointer"
                    onClick={() => setViewingReceipt(r)}
                  >
                    <td className="px-4 py-4 border-bottom-0 fw-black text-dark">#{r.receiptNo}</td>
                    <td className="py-4 border-bottom-0">
                      <div className="fw-bold text-dark">{r.publisher}</div>
                      {r.notes && <div className="text-muted small text-truncate" style={{ maxWidth: 200 }}>{r.notes}</div>}
                    </td>
                    <td className="py-4 border-bottom-0">
                      <div className="vstack gap-1">
                        {r.items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border fw-medium" style={{ fontSize: '0.65rem' }}>{item.qty}x</span>
                            <span className="text-dark small fw-medium text-truncate" style={{ maxWidth: 120 }}>{item.bookTitle}</span>
                          </div>
                        ))}
                        {r.items.length > 2 && <div className="text-muted tiny">+{r.items.length - 2} more items</div>}
                      </div>
                    </td>
                    <td className="py-4 border-bottom-0">
                      <div className="fw-black" style={{ fontSize: '1.1rem' }}>
                        {r.items.reduce((sum: number, i: any) => sum + i.qty, 0)}
                      </div>
                    </td>
                    <td className="py-4 border-bottom-0 text-muted small">
                      <div className="d-flex align-items-center gap-1">
                        <User className="w-3 h-3" />
                        {r.receivedByName}
                      </div>
                    </td>
                    <td className="py-4 border-bottom-0 text-muted small">
                      <div className="d-flex align-items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(r.receivedAt)}
                      </div>
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
        )}
      </GlassCard>

      {/* View Receipt Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
        <DialogContent className="border-0 shadow-lg rounded-4 p-0 overflow-hidden" style={{ maxWidth: 600 }}>
          {viewingReceipt && (
            <>
              <div className="bg-light p-4 border-bottom">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div className="badge bg-primary mb-2">#{viewingReceipt.receiptNo}</div>
                    <h4 className="fw-black mb-1">{viewingReceipt.publisher}</h4>
                    <p className="text-muted small mb-0">Record of stock inbound shipment</p>
                  </div>
                  <div className="text-end">
                    <div className="text-muted tiny text-uppercase fw-bold mb-1">Status Date</div>
                    <div className="fw-bold small">{fmtDate(viewingReceipt.receivedAt)}</div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="row g-4 mb-4">
                  <div className="col-6">
                    <div className="text-muted tiny text-uppercase fw-bold mb-1">Received By</div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                        {viewingReceipt.receivedByName?.charAt(0)}
                      </div>
                      <span className="fw-medium small">{viewingReceipt.receivedByName}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-muted tiny text-uppercase fw-bold mb-3">Itemized Contents</div>
                  <div className="vstack gap-2">
                    {viewingReceipt.items.map((it: any, idx: number) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4 border border-blue-50">
                        <div className="d-flex align-items-center gap-3">
                          <div className="fw-black text-primary px-2 py-1 bg-white rounded-3 border" style={{ minWidth: 40, textAlign: 'center' }}>
                            {it.qty}
                          </div>
                          <div>
                            <div className="fw-bold text-dark small">{it.bookTitle}</div>
                            {Number(it.buyingPrice) > 0 && <div className="text-muted tiny">Cost per unit: {formatCurrency(it.buyingPrice)}</div>}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-black text-dark">{formatCurrency(Number(it.buyingPrice) * it.qty)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {viewingReceipt.notes && (
                  <div>
                    <div className="text-muted tiny text-uppercase fw-bold mb-2">Shipment Notes</div>
                    <div className="p-3 bg-light rounded-3 text-muted small italic border-start border-3 border-muted">
                      "{viewingReceipt.notes}"
                    </div>
                  </div>
                )}

                <div className="mt-5 d-flex justify-content-end">
                  <button className="btn btn-outline-secondary rounded-pill px-4 fw-bold" onClick={() => setViewingReceipt(null)}>
                    Close Record
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-0 shadow-lg rounded-4 p-0 overflow-hidden" style={{ maxWidth: 720 }}>
          <div className="bg-primary p-4 text-white">
            <DialogHeader>
              <DialogTitle className="fw-black text-white h4 mb-1">Record Inbound Shipment</DialogTitle>
              <p className="text-white-50 small mb-0">Update your inventory by reflecting new stock received.</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleCreate} data-testid="stock-receipt-form" className="p-4 bg-white">
            <div className="row g-4">
              <div className="col-12">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Publisher / Supplier</label>
                <div className="input-group input-group-lg shadow-none border rounded-4 overflow-hidden">
                  <span className="input-group-text bg-light border-0"><Building2 className="w-5 h-5 text-muted" /></span>
                  <input
                    type="text"
                    className="form-control border-0 bg-light p-3 fs-6 h-auto"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="E.g. Penguin Random House"
                    required
                    data-testid="input-publisher"
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label small text-muted text-uppercase fw-black mb-0" style={{ letterSpacing: '0.5px' }}>Shipment Contents</label>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-primary fw-bold"
                    onClick={addItem}
                    data-testid="button-add-item"
                  >
                    <Plus className="w-3.5 h-3.5 me-1" />
                    Add More Books
                  </button>
                </div>

                <div className="vstack gap-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-light rounded-4 border position-relative group">
                      <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-5">
                          <select
                            className="form-select border-0 bg-white shadow-sm fw-bold"
                            value={item.bookId}
                            onChange={(e) => updateItem(idx, "bookId", Number(e.target.value))}
                            data-testid={`select-book-${idx}`}
                          >
                            <option value={0}>Choose a book…</option>
                            {(booksData || []).map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4 col-md-2">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-0 text-muted px-2">Qty</span>
                            <input
                              type="number"
                              className="form-control border-0 bg-white shadow-sm fw-bold"
                              min={1}
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                              data-testid={`input-qty-${idx}`}
                            />
                          </div>
                        </div>
                        <div className="col-4 col-md-2">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-0 text-muted px-2">$</span>
                            <input
                              type="number"
                              className="form-control border-0 bg-white shadow-sm fw-bold"
                              min={0}
                              step="0.01"
                              value={item.buyingPrice}
                              onChange={(e) => updateItem(idx, "buyingPrice", e.target.value)}
                              placeholder="Buy"
                              data-testid={`input-buying-price-${idx}`}
                            />
                          </div>
                        </div>
                        <div className="col-3 col-md-2">
                          <div className="input-group input-group-sm">
                            <input
                              type="number"
                              className="form-control border-0 bg-white shadow-sm fw-bold"
                              min={0}
                              max={100}
                              step="0.1"
                              value={item.companyDiscount}
                              onChange={(e) => updateItem(idx, "companyDiscount", e.target.value)}
                              placeholder="0%"
                              data-testid={`input-company-discount-${idx}`}
                            />
                            <span className="input-group-text bg-white border-0 text-muted px-1.5">%</span>
                          </div>
                        </div>
                        <div className="col-1">
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost-destructive p-1 rounded-circle"
                              onClick={() => removeItem(idx)}
                              data-testid={`button-remove-item-${idx}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label small text-muted text-uppercase fw-black mb-2" style={{ letterSpacing: '0.5px' }}>Documentation Notes</label>
                <div className="input-group shadow-none border rounded-4 overflow-hidden">
                  <span className="input-group-text bg-light border-0"><FileText className="w-5 h-5 text-muted" /></span>
                  <textarea
                    className="form-control border-0 bg-light p-3 h-auto"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add delivery reference, tracking numbers or damage reports…"
                    data-testid="input-notes"
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 mt-5">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold"
                onClick={() => setCreateOpen(false)}
                data-testid="button-cancel-receipt"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary pb-sheen rounded-pill px-5 py-2 fw-bold shadow-sm"
                disabled={createMutation.isPending}
                data-testid="button-submit-receipt"
              >
                {createMutation.isPending ? "Processing…" : "Confirm Receipt"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
