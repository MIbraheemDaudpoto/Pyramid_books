import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useBooks, useCreateBook, useDeleteBook, useUpdateBook } from "@/hooks/use-books";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import type { CreateBookRequest, UpdateBookRequest } from "@shared/schema";
import { BookOpen, Plus, Search, Trash2, Pencil, AlertTriangle, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";

function money(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
}

const bookFormSchema = z.object({
  isbn: z.string().optional().or(z.literal("")),
  title: z.string().min(1, "Title is required"),
  author: z.string().optional().or(z.literal("")),
  publisher: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  unitPrice: z.coerce.number().nonnegative(),
  stockQty: z.coerce.number().int().nonnegative(),
  reorderLevel: z.coerce.number().int().nonnegative(),
  isActive: z.boolean().optional(),
});

type BookFormState = z.infer<typeof bookFormSchema>;

export default function BooksPage() {
  const { toast } = useToast();
  const { data: me } = useMe();
  const isAdmin = me?.role === "super_admin";

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const { data, isLoading, error } = useBooks({ q: q || undefined, category: category || undefined, lowStock });

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set).sort();
  }, [data]);

  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const deleteMutation = useDeleteBook();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<BookFormState>({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    category: "",
    description: "",
    unitPrice: 0,
    stockQty: 0,
    reorderLevel: 10,
    isActive: true,
  });

  function openCreate() {
    setForm({
      isbn: "",
      title: "",
      author: "",
      publisher: "",
      category: "",
      description: "",
      unitPrice: 0,
      stockQty: 0,
      reorderLevel: 10,
      isActive: true,
    });
    setCreateOpen(true);
  }

  function openEdit(id: number) {
    const b = (data || []).find((x) => x.id === id);
    if (!b) return;
    setEditingId(id);
    setForm({
      isbn: b.isbn ?? "",
      title: b.title ?? "",
      author: b.author ?? "",
      publisher: b.publisher ?? "",
      category: b.category ?? "",
      description: b.description ?? "",
      unitPrice: Number(b.unitPrice ?? 0),
      stockQty: Number(b.stockQty ?? 0),
      reorderLevel: Number(b.reorderLevel ?? 10),
      isActive: Boolean(b.isActive),
    });
    setEditOpen(true);
  }

  async function submitCreate() {
    const parsed = bookFormSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Fix the form", description: parsed.error.errors[0]?.message ?? "Invalid input", variant: "destructive" });
      return;
    }
    const payload: CreateBookRequest = {
      ...parsed.data,
      isbn: parsed.data.isbn || null,
      author: parsed.data.author || null,
      publisher: parsed.data.publisher || null,
      category: parsed.data.category || null,
      description: parsed.data.description || null,
      isActive: parsed.data.isActive ?? true,
      unitPrice: String(parsed.data.unitPrice) as any,
      stockQty: parsed.data.stockQty,
      reorderLevel: parsed.data.reorderLevel,
      createdAt: undefined as any,
      id: undefined as any,
    } as any;

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Book created", description: "New title added to the catalog." });
        setCreateOpen(false);
      },
      onError: (e) => toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" }),
    });
  }

  async function submitEdit() {
    if (!editingId) return;
    const parsed = bookFormSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Fix the form", description: parsed.error.errors[0]?.message ?? "Invalid input", variant: "destructive" });
      return;
    }

    const updates: UpdateBookRequest = {
      ...parsed.data,
      isbn: parsed.data.isbn || null,
      author: parsed.data.author || null,
      publisher: parsed.data.publisher || null,
      category: parsed.data.category || null,
      description: parsed.data.description || null,
      isActive: parsed.data.isActive ?? true,
      unitPrice: String(parsed.data.unitPrice) as any,
      stockQty: parsed.data.stockQty,
      reorderLevel: parsed.data.reorderLevel,
    } as any;

    updateMutation.mutate(
      { id: editingId, updates },
      {
        onSuccess: () => {
          toast({ title: "Book updated", description: "Changes saved." });
          setEditOpen(false);
        },
        onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  function askDelete(id: number) {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        toast({ title: "Book deleted", description: "Removed from catalog." });
        setConfirmDeleteOpen(false);
      },
      onError: (e) => toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" }),
    });
  }

  return (
    <AppShell>
      <Seo title="Books — Pyramid Books" description="Browse and manage book catalog, stock and pricing." />

      <SectionHeader
        title="Books"
        subtitle="Catalog, pricing, and stock signals. Low-stock toggles help you reorder before you miss a shipment."
        right={
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
              onClick={() => setLowStock((v) => !v)}
              data-testid="books-toggle-lowstock"
            >
              <Filter className="w-4 h-4" />
              Low stock {lowStock ? "On" : "Off"}
            </button>
            {isAdmin && (
              <button className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2" onClick={openCreate} data-testid="books-create">
                <Plus className="w-4 h-4" />
                Add book
              </button>
            )}
          </div>
        }
      />

      <GlassCard>
        <div className="row g-2 g-md-3 align-items-end">
          <div className="col-12 col-md-6">
            <label className="form-label small text-muted">Search</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent" style={{ borderColor: "hsl(var(--input))" }}>
                <Search className="w-4 h-4" />
              </span>
              <input
                className="form-control"
                placeholder="Title, ISBN, author…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                data-testid="books-search"
              />
              <button className="btn btn-outline-primary" onClick={() => setQ("")} data-testid="books-clear-search">
                Clear
              </button>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label small text-muted">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="books-category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label small text-muted">Actions</label>
            <button
              className="btn btn-outline-primary w-100"
              onClick={() => {
                setQ("");
                setCategory("");
                setLowStock(false);
              }}
              data-testid="books-reset-filters"
            >
              Reset
            </button>
          </div>
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
          <div className="alert alert-danger" role="alert" data-testid="books-error">
            {(error as Error).message}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-6 h-6 text-muted" />}
            title="No books found"
            description="Try adjusting filters, or add your first title to start tracking stock and orders."
            action={
              isAdmin ? (
                <button className="btn btn-primary pb-sheen" onClick={openCreate} data-testid="books-empty-add">
                  Add a book
                </button>
              ) : (
                <button className="btn btn-outline-primary" onClick={() => window.location.reload()} data-testid="books-empty-refresh">
                  Refresh
                </button>
              )
            }
            testId="books-empty"
          />
        ) : (
          <GlassCard testId="books-table">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ minWidth: 260 }}>Title</th>
                    <th className="d-none d-lg-table-cell">Author</th>
                    <th>Category</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Stock</th>
                    <th className="text-end d-none d-xl-table-cell">Reorder</th>
                    <th className="text-end" style={{ width: 150 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.map((b) => {
                    const low = Number(b.stockQty) <= Number(b.reorderLevel);
                    return (
                      <tr key={b.id}>
                        <td>
                          <div className="fw-semibold">{b.title}</div>
                          <div className="text-muted small">
                            {b.isbn ? `ISBN ${b.isbn}` : "No ISBN"} • {b.publisher ?? "Publisher —"}
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell">{b.author ?? "—"}</td>
                        <td>
                          <span className="badge rounded-pill text-bg-light border">{b.category ?? "Uncategorized"}</span>
                        </td>
                        <td className="text-end fw-semibold">{money(b.unitPrice)}</td>
                        <td className="text-end">
                          <span
                            className="badge rounded-pill"
                            style={{
                              background: low ? "hsl(var(--primary) / .14)" : "hsl(152 52% 42% / .14)",
                              color: low ? "hsl(var(--primary))" : "hsl(152 52% 42%)",
                              border: "1px solid hsl(var(--border))",
                            }}
                          >
                            {b.stockQty}
                            {low ? " • low" : ""}
                          </span>
                        </td>
                        <td className="text-end d-none d-xl-table-cell">{b.reorderLevel}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                              onClick={() => openEdit(b.id)}
                              disabled={!isAdmin}
                              data-testid={`books-edit-${b.id}`}
                              title={isAdmin ? "Edit book" : "Admins only"}
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="d-none d-lg-inline">Edit</span>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2"
                              onClick={() => askDelete(b.id)}
                              disabled={!isAdmin}
                              data-testid={`books-delete-${b.id}`}
                              title={isAdmin ? "Delete book" : "Admins only"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!isAdmin && (
              <div className="text-muted small mt-3 d-flex align-items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                You have read-only access to the catalog.
              </div>
            )}
          </GlassCard>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl" data-testid="books-create-dialog">
          <DialogHeader>
            <DialogTitle>Add Book</DialogTitle>
          </DialogHeader>

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} data-testid="book-form-title" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">ISBN</label>
              <input className="form-control" value={form.isbn ?? ""} onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))} data-testid="book-form-isbn" />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Author</label>
              <input className="form-control" value={form.author ?? ""} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} data-testid="book-form-author" />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Publisher</label>
              <input className="form-control" value={form.publisher ?? ""} onChange={(e) => setForm((p) => ({ ...p, publisher: e.target.value }))} data-testid="book-form-publisher" />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Category</label>
              <input className="form-control" value={form.category ?? ""} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} data-testid="book-form-category" />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Unit price</label>
              <input type="number" step="0.01" className="form-control" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))} data-testid="book-form-unitPrice" />
            </div>
            <div className="col-6 col-md-1">
              <label className="form-label">Stock</label>
              <input type="number" className="form-control" value={form.stockQty} onChange={(e) => setForm((p) => ({ ...p, stockQty: Number(e.target.value) }))} data-testid="book-form-stockQty" />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Reorder</label>
              <input type="number" className="form-control" value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: Number(e.target.value) }))} data-testid="book-form-reorderLevel" />
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} data-testid="book-form-description" />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-1">
              <button className="btn btn-outline-primary" onClick={() => setCreateOpen(false)} data-testid="book-form-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen" onClick={submitCreate} disabled={createMutation.isPending} data-testid="book-form-submit">
                {createMutation.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl" data-testid="books-edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} data-testid="book-edit-title" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">ISBN</label>
              <input className="form-control" value={form.isbn ?? ""} onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))} data-testid="book-edit-isbn" />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Author</label>
              <input className="form-control" value={form.author ?? ""} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} data-testid="book-edit-author" />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Publisher</label>
              <input className="form-control" value={form.publisher ?? ""} onChange={(e) => setForm((p) => ({ ...p, publisher: e.target.value }))} data-testid="book-edit-publisher" />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Category</label>
              <input className="form-control" value={form.category ?? ""} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} data-testid="book-edit-category" />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Unit price</label>
              <input type="number" step="0.01" className="form-control" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))} data-testid="book-edit-unitPrice" />
            </div>
            <div className="col-6 col-md-1">
              <label className="form-label">Stock</label>
              <input type="number" className="form-control" value={form.stockQty} onChange={(e) => setForm((p) => ({ ...p, stockQty: Number(e.target.value) }))} data-testid="book-edit-stockQty" />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Reorder</label>
              <input type="number" className="form-control" value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: Number(e.target.value) }))} data-testid="book-edit-reorderLevel" />
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} data-testid="book-edit-description" />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-1">
              <button className="btn btn-outline-primary" onClick={() => setEditOpen(false)} data-testid="book-edit-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen" onClick={submitEdit} disabled={updateMutation.isPending} data-testid="book-edit-submit">
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete this book?"
        description="This removes the title from your catalog. Existing orders may depend on it."
        confirmText={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={confirmDelete}
        testId="books-delete-confirm"
      />
    </AppShell>
  );
}
