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
import { BOOK_CATEGORIES } from "@shared/schema";
import { BookOpen, Plus, Search, Trash2, Pencil, AlertTriangle, Filter, Tag, Hash, User, Building, Info, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";
import { formatCurrency, cn } from "@/lib/utils";

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
  const isAdmin = me?.role === "admin";

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const { data, isLoading, error } = useBooks({ q: q || undefined, category: category || undefined, lowStock });

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  const categories = BOOK_CATEGORIES;

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
        subtitle="Catalog, pricing, and stock signals. Keep track of your inventory levels."
        right={
          <div className="d-flex flex-wrap gap-2">
            <button
              className={cn(
                "btn d-inline-flex align-items-center gap-2 border-2 px-3 fw-medium",
                lowStock ? "btn-primary shadow-sm" : "btn-outline-primary"
              )}
              onClick={() => setLowStock((v) => !v)}
              data-testid="books-toggle-lowstock"
            >
              <AlertTriangle className="w-4 h-4" />
              Low Stock Only
            </button>
            {(isAdmin || me?.role === "salesman") && (
              <button className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2 px-4 shadow-sm" onClick={openCreate} data-testid="books-create">
                <Plus className="w-4 h-4" />
                Add Book
              </button>
            )}
          </div>
        }
      />

      <GlassCard className="border-0 shadow-sm p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="input-group input-group-lg bg-light rounded-4 overflow-hidden border-0">
              <span className="input-group-text bg-transparent border-0 ps-3">
                <Search className="w-5 h-5 text-muted" />
              </span>
              <input
                className="form-control border-0 bg-transparent py-3 shadow-none fw-medium"
                placeholder="Search by title, author, or ISBN…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                data-testid="books-search"
              />
              {q && (
                <button className="btn btn-link text-muted pe-3 text-decoration-none" onClick={() => setQ("")} data-testid="books-clear-search">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-8 col-lg-4">
            <div className="d-flex align-items-center h-100 bg-light rounded-4 px-3">
              <Filter className="w-4 h-4 text-muted shrink-0 me-2" />
              <select
                className="form-select border-0 bg-transparent shadow-none fw-medium py-3"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                data-testid="books-category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12 col-md-4 col-lg-2">
            <button
              className="btn btn-outline-secondary w-100 py-3 rounded-4 border-2 fw-bold d-flex align-items-center justify-content-center gap-2"
              onClick={() => {
                setQ("");
                setCategory("");
                setLowStock(false);
              }}
              data-testid="books-reset-filters"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="mt-4">
        {isLoading ? (
          <GlassCard className="border-0">
            <div className="placeholder-glow vstack gap-3">
              <div className="placeholder col-12 rounded-3" style={{ height: 60 }} />
              <div className="placeholder col-12 rounded-3" style={{ height: 60 }} />
              <div className="placeholder col-12 rounded-3" style={{ height: 60 }} />
            </div>
          </GlassCard>
        ) : error ? (
          <GlassCard className="border-danger/20 text-center py-5">
            <XCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-20" />
            <h5 className="fw-bold text-danger">Error Loading Catalog</h5>
            <p className="text-secondary">{(error as Error).message}</p>
            <button className="btn btn-outline-danger mt-2 px-4 shadow-sm" onClick={() => window.location.reload()}>Retry</button>
          </GlassCard>
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-muted opacity-20" />}
            title="Catalog is empty"
            description="No books match your current filters. Try relaxing your search criteria."
            action={
              isAdmin ? (
                <button className="btn btn-primary pb-sheen px-4" onClick={openCreate} data-testid="books-empty-add">
                  Add a Book
                </button>
              ) : (
                <button className="btn btn-outline-primary px-4" onClick={() => window.location.reload()} data-testid="books-empty-refresh">
                  Refresh
                </button>
              )
            }
            testId="books-empty"
          />
        ) : (
          <GlassCard testId="books-table" className="border-0 shadow-sm overflow-hidden p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small border-0">
                    <th className="px-4 py-3 border-0 text-uppercase fw-bold" style={{ minWidth: 280 }}>Book Details</th>
                    <th className="py-3 border-0 text-uppercase fw-bold d-none d-lg-table-cell">Category</th>
                    <th className="py-3 border-0 text-uppercase fw-bold text-end">Price</th>
                    <th className="py-3 border-0 text-uppercase fw-bold text-center">In Stock</th>
                    <th className="px-4 py-3 border-0 text-uppercase fw-bold text-end" style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="border-0">
                  {data!.map((b) => {
                    const low = Number(b.stockQty) <= Number(b.reorderLevel);
                    return (
                      <tr key={b.id} className="border-0">
                        <td className="px-4 py-3 border-bottom-0">
                          <div className="d-flex align-items-center gap-3">
                            <div className="p-3 bg-light rounded-4 text-primary shrink-0 d-none d-sm-block">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="fw-bold text-dark fs-6">{b.title}</div>
                              <div className="text-muted small d-flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                <span className="d-flex align-items-center gap-1">
                                  <User className="w-3 h-3" /> {b.author || 'Unknown Author'}
                                </span>
                                {b.isbn && (
                                  <span className="d-flex align-items-center gap-1">
                                    <Hash className="w-3 h-3" /> {b.isbn}
                                  </span>
                                )}
                                {b.publisher && (
                                  <span className="d-flex align-items-center gap-1">
                                    <Building className="w-3 h-3" /> {b.publisher}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 border-bottom-0 d-none d-lg-table-cell">
                          <span className="badge rounded-pill bg-light text-dark border px-2 py-1.5 fw-medium d-inline-flex align-items-center gap-1">
                            <Tag className="w-3 h-3 text-muted" />
                            {b.category ?? "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-3 border-bottom-0 text-end">
                          <div className="fw-bold text-primary">{formatCurrency(b.unitPrice)}</div>
                        </td>
                        <td className="py-3 border-bottom-0 text-center">
                          <div className={cn(
                            "badge rounded-pill d-inline-flex flex-column align-items-center gap-1 px-3 py-2 border",
                            low ? "bg-warning-subtle text-warning-emphasis border-warning-subtle" : "bg-success-subtle text-success-emphasis border-success-subtle"
                          )}>
                            <div className="d-flex align-items-center gap-1">
                              {low ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              <span className="fs-6 fw-bold">{b.stockQty}</span>
                            </div>
                            <span className="text-uppercase fw-bold" style={{ fontSize: '0.6rem', letterSpacing: '0.4px' }}>
                              {low ? "Low Stock" : "In Stock"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-bottom-0 text-end">
                          <div className="d-inline-flex gap-1">
                            <button
                              className="btn btn-icon btn-ghost-primary rounded-circle"
                              onClick={() => openEdit(b.id)}
                              disabled={!isAdmin && me?.role !== "salesman"}
                              data-testid={`books-edit-${b.id}`}
                              title="Edit Details"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="btn btn-icon btn-ghost-danger rounded-circle"
                              onClick={() => askDelete(b.id)}
                              disabled={!isAdmin}
                              data-testid={`books-delete-${b.id}`}
                              title="Delete Title"
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
              <div className="px-4 py-3 bg-light border-top d-flex align-items-center gap-2 text-muted small">
                <AlertCircle className="w-4 h-4" />
                <span>You have read-only access to the catalog management features.</span>
              </div>
            )}
          </GlassCard>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl border-0 shadow-lg rounded-4 overflow-hidden p-0" data-testid="books-create-dialog">
          <div className="bg-primary p-4 text-white">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <Plus className="w-6 h-6" />
              Add New Book
            </h5>
            <p className="text-white-50 small mb-0 mt-1">Add a new title to your bookstore inventory.</p>
          </div>

          <div className="p-4 bg-white">
            <div className="row g-4">
              <div className="col-12 col-md-8">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Book Title</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><BookOpen className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} data-testid="book-form-title" />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">ISBN</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Hash className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.isbn ?? ""} onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))} data-testid="book-form-isbn" />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Author</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><User className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.author ?? ""} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} data-testid="book-form-author" />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Publisher</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Building className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.publisher ?? ""} onChange={(e) => setForm((p) => ({ ...p, publisher: e.target.value }))} data-testid="book-form-publisher" />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Category</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Tag className="w-4 h-4" /></span>
                  <select className="form-select bg-light border-0" value={form.category ?? ""} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} data-testid="book-form-category">
                    <option value="">Select Category</option>
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-1">Unit Price</label>
                    <input type="number" step="0.01" className="form-control bg-light border-0" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))} data-testid="book-form-unitPrice" />
                  </div>
                  <div className="col-3">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-1">Stock</label>
                    <input type="number" className="form-control bg-light border-0" value={form.stockQty} onChange={(e) => setForm((p) => ({ ...p, stockQty: Number(e.target.value) }))} data-testid="book-form-stockQty" />
                  </div>
                  <div className="col-3">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-1">Reorder</label>
                    <input type="number" className="form-control bg-light border-0" value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: Number(e.target.value) }))} data-testid="book-form-reorderLevel" />
                  </div>
                </div>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Description</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 align-items-start pt-2"><Info className="w-4 h-4" /></span>
                  <textarea className="form-control bg-light border-0" rows={3} value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} data-testid="book-form-description" />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 mt-5">
              <button className="btn btn-outline-secondary border-2 px-4 fw-bold" onClick={() => setCreateOpen(false)} data-testid="book-form-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen px-5 shadow-sm fw-bold" onClick={submitCreate} disabled={createMutation.isPending} data-testid="book-form-submit">
                {createMutation.isPending ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Create Book
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl border-0 shadow-lg rounded-4 overflow-hidden p-0" data-testid="books-edit-dialog">
          <div className="bg-primary p-4 text-white">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <Pencil className="w-6 h-6" />
              Edit Book Details
            </h5>
            <p className="text-white-50 small mb-0 mt-1">Modify information for "{form.title}".</p>
          </div>

          <div className="p-4 bg-white">
            <div className="row g-4">
              <div className="col-12 col-md-8">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Book Title</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><BookOpen className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} data-testid="book-edit-title" />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">ISBN</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Hash className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.isbn ?? ""} onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))} data-testid="book-edit-isbn" />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Author</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><User className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.author ?? ""} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} data-testid="book-edit-author" />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Publisher</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Building className="w-4 h-4" /></span>
                  <input className="form-control bg-light border-0" value={form.publisher ?? ""} onChange={(e) => setForm((p) => ({ ...p, publisher: e.target.value }))} data-testid="book-edit-publisher" />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Category</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Tag className="w-4 h-4" /></span>
                  <select className="form-select bg-light border-0" value={form.category ?? ""} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} data-testid="book-edit-category">
                    <option value="">Select Category</option>
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-1">Unit Price</label>
                    <input type="number" step="0.01" className="form-control bg-light border-0" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))} data-testid="book-edit-unitPrice" />
                  </div>
                  <div className="col-3">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-1">Stock</label>
                    <input type="number" className="form-control bg-light border-0" value={form.stockQty} onChange={(e) => setForm((p) => ({ ...p, stockQty: Number(e.target.value) }))} data-testid="book-edit-stockQty" />
                  </div>
                  <div className="col-3">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-1">Reorder</label>
                    <input type="number" className="form-control bg-light border-0" value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: Number(e.target.value) }))} data-testid="book-edit-reorderLevel" />
                  </div>
                </div>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Description</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 align-items-start pt-2"><Info className="w-4 h-4" /></span>
                  <textarea className="form-control bg-light border-0" rows={3} value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} data-testid="book-edit-description" />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 mt-5">
              <button className="btn btn-outline-secondary border-2 px-4 fw-bold" onClick={() => setEditOpen(false)} data-testid="book-edit-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen px-5 shadow-sm fw-bold" onClick={submitEdit} disabled={updateMutation.isPending} data-testid="book-edit-submit">
                {updateMutation.isPending ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Save Changes
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete this book?"
        description="This removes the title from your catalog. Existing orders may depend on it. This action cannot be undone."
        confirmText={deleteMutation.isPending ? "Deleting…" : "Delete Forever"}
        destructive
        onConfirm={confirmDelete}
        testId="books-delete-confirm"
      />
    </AppShell>
  );
}
