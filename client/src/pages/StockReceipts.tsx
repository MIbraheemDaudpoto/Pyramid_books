import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useStockReceipts, useCreateStockReceipt } from "@/hooks/use-stock-receipts";
import { useBooks } from "@/hooks/use-books";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function fmtDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function money(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
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
      toast({ title: "Publisher is required", variant: "destructive" });
      return;
    }
    const validItems = items.filter((i) => i.bookId > 0 && i.qty > 0);
    if (validItems.length === 0) {
      toast({ title: "Add at least one book item", variant: "destructive" });
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
      toast({ title: "Received stock recorded" });
      setCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: err.message || "Failed to create receipt", variant: "destructive" });
    }
  }

  if (!me) return null;

  return (
    <AppShell>
      <Seo title="Received Stock | Pyramid Books" />
      <SectionHeader
        title="Received Stock"
        subtitle="Track inventory received from publishers"
        testId="header-stock-receipts"
        right={
          canManage && (
            <button
              type="button"
              className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
              onClick={() => { resetForm(); setCreateOpen(true); }}
              data-testid="button-create-receipt"
            >
              <Plus className="w-4 h-4" />
              New Receipt
            </button>
          )
        }
      />

      <GlassCard testId="stock-receipts-table-card">
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : !receipts || receipts.length === 0 ? (
          <div className="text-center py-5 text-muted" data-testid="empty-stock-receipts">
            <Package className="mx-auto mb-3" style={{ width: 48, height: 48, opacity: 0.4 }} />
            <div>No received stock yet</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="stock-receipts-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Publisher</th>
                  <th>Items</th>
                  <th>Total Qty</th>
                  <th>Received By</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} data-testid={`stock-receipt-row-${r.id}`}>
                    <td className="fw-semibold">{r.receiptNo}</td>
                    <td>{r.publisher}</td>
                    <td>
                      {r.items.map((item: any, idx: number) => (
                        <div key={idx} className="small">
                          {item.bookTitle} x{item.qty}
                          {Number(item.buyingPrice) > 0 && (
                            <span className="text-muted ms-1">@ {money(item.buyingPrice)}</span>
                          )}
                          {Number(item.companyDiscount) > 0 && (
                            <span className="text-success ms-1">({item.companyDiscount}% off)</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td>{r.items.reduce((sum: number, i: any) => sum + i.qty, 0)}</td>
                    <td>{r.receivedByName}</td>
                    <td>{fmtDate(r.receivedAt)}</td>
                    <td className="text-muted small">{r.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg" style={{ maxWidth: 720 }}>
          <DialogHeader>
            <DialogTitle>New Received Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} data-testid="stock-receipt-form">
            <div className="mb-3">
              <label className="form-label fw-semibold">Publisher / Company</label>
              <input
                type="text"
                className="form-control"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Enter publisher or company name"
                data-testid="input-publisher"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Books</label>
              <div className="small text-muted mb-2">Select books, enter quantity, buying price, and company discount %</div>
              {items.map((item, idx) => (
                <div key={idx} className="d-flex gap-2 mb-2 align-items-center flex-wrap">
                  <select
                    className="form-select"
                    style={{ minWidth: 180, flex: "2 1 0" }}
                    value={item.bookId}
                    onChange={(e) => updateItem(idx, "bookId", Number(e.target.value))}
                    data-testid={`select-book-${idx}`}
                  >
                    <option value={0}>Select book...</option>
                    {(booksData || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (Stock: {b.stockQty})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: 75 }}
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                    placeholder="Qty"
                    title="Quantity"
                    data-testid={`input-qty-${idx}`}
                  />
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: 100 }}
                    min={0}
                    step="0.01"
                    value={item.buyingPrice}
                    onChange={(e) => updateItem(idx, "buyingPrice", e.target.value)}
                    placeholder="Buy Price"
                    title="Buying Price"
                    data-testid={`input-buying-price-${idx}`}
                  />
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: 90 }}
                    min={0}
                    max={100}
                    step="0.1"
                    value={item.companyDiscount}
                    onChange={(e) => updateItem(idx, "companyDiscount", e.target.value)}
                    placeholder="Disc %"
                    title="Company Discount %"
                    data-testid={`input-company-discount-${idx}`}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeItem(idx)}
                      data-testid={`button-remove-item-${idx}`}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                onClick={addItem}
                data-testid="button-add-item"
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add Book
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Notes</label>
              <textarea
                className="form-control"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                data-testid="input-notes"
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setCreateOpen(false)}
                data-testid="button-cancel-receipt"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary pb-sheen"
                disabled={createMutation.isPending}
                data-testid="button-submit-receipt"
              >
                {createMutation.isPending ? "Saving..." : "Create Receipt"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
