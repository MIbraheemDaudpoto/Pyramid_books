import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useCustomers, useCreateCustomer, useDeleteCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import type { CreateCustomerRequest, UpdateCustomerRequest } from "@shared/schema";
import { Building2, Plus, Search, Trash2, Pencil, BadgeCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";

function money(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
}

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  customerType: z.string().min(1, "Customer type is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  creditLimit: z.coerce.number().nonnegative(),
  notes: z.string().optional().or(z.literal("")),
  assignedSalesmanUserId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

type CustomerFormState = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const { toast } = useToast();
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin";
  const canManage = isAdmin || me?.role === "salesman";

  const { data, isLoading, error } = useCustomers();
  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const list = data || [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((c) => (c.name || "").toLowerCase().includes(s) || (c.phone || "").toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s));
  }, [data, q]);

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<CustomerFormState>({
    name: "",
    customerType: "customer",
    phone: "",
    email: "",
    address: "",
    creditLimit: 0,
    notes: "",
    assignedSalesmanUserId: null,
    isActive: true,
  });

  function openCreate() {
    setForm({
      name: "",
      customerType: "customer",
      phone: "",
      email: "",
      address: "",
      creditLimit: 0,
      notes: "",
      assignedSalesmanUserId: null,
      isActive: true,
    });
    setCreateOpen(true);
  }

  function openEdit(id: number) {
    const c = (data || []).find((x) => x.id === id);
    if (!c) return;
    setEditingId(id);
    setForm({
      name: c.name ?? "",
      customerType: c.customerType ?? "customer",
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      creditLimit: Number(c.creditLimit ?? 0),
      notes: c.notes ?? "",
      assignedSalesmanUserId: (c.assignedSalesmanUserId ?? null) as any,
      isActive: Boolean(c.isActive),
    });
    setEditOpen(true);
  }

  function askDelete(id: number) {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  }

  function submitCreate() {
    const parsed = customerFormSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Fix the form", description: parsed.error.errors[0]?.message ?? "Invalid input", variant: "destructive" });
      return;
    }
    const payload: CreateCustomerRequest = {
      ...parsed.data,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      creditLimit: String(parsed.data.creditLimit) as any,
      assignedSalesmanUserId: parsed.data.assignedSalesmanUserId ?? null,
      isActive: parsed.data.isActive ?? true,
      createdAt: undefined as any,
      id: undefined as any,
    } as any;

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Customer created", description: "Customer profile added." });
        setCreateOpen(false);
      },
      onError: (e) => toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" }),
    });
  }

  function submitEdit() {
    if (!editingId) return;
    const parsed = customerFormSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Fix the form", description: parsed.error.errors[0]?.message ?? "Invalid input", variant: "destructive" });
      return;
    }
    const updates: UpdateCustomerRequest = {
      ...parsed.data,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      creditLimit: String(parsed.data.creditLimit) as any,
      assignedSalesmanUserId: parsed.data.assignedSalesmanUserId ?? null,
      isActive: parsed.data.isActive ?? true,
    } as any;

    updateMutation.mutate(
      { id: editingId, updates },
      {
        onSuccess: () => {
          toast({ title: "Customer updated", description: "Changes saved." });
          setEditOpen(false);
        },
        onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        toast({ title: "Customer deleted", description: "Customer removed." });
        setConfirmDeleteOpen(false);
      },
      onError: (e) => toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" }),
    });
  }

  return (
    <AppShell>
      <Seo title="Customers — Pyramid Books" description="Manage customers, credit limits, and assignments." />

      <SectionHeader
        title="Customers"
        subtitle={canManage ? "Profiles, credit limits, and notes. Search fast—act carefully." : "Your customer information."}
        right={
          <div className="d-flex flex-wrap gap-2">
            {canManage && (
              <button className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2" onClick={openCreate} data-testid="customers-create">
                <Plus className="w-4 h-4" />
                Add customer
              </button>
            )}
          </div>
        }
      />

      <GlassCard>
        <label className="form-label small text-muted">Search</label>
        <div className="input-group">
          <span className="input-group-text bg-transparent" style={{ borderColor: "hsl(var(--input))" }}>
            <Search className="w-4 h-4" />
          </span>
          <input className="form-control" placeholder="Name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="customers-search" />
          <button className="btn btn-outline-primary" onClick={() => setQ("")} data-testid="customers-clear-search">
            Clear
          </button>
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
          <div className="alert alert-danger" role="alert" data-testid="customers-error">
            {(error as Error).message}
          </div>
        ) : (filtered.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Building2 className="w-6 h-6 text-muted" />}
            title="No customers yet"
            description="Add a customer to start creating orders and recording payments."
            action={
              canManage ? (
                <button className="btn btn-primary pb-sheen" onClick={openCreate} data-testid="customers-empty-add">
                  Add customer
                </button>
              ) : (
                <button className="btn btn-outline-primary" onClick={() => window.location.reload()} data-testid="customers-empty-refresh">
                  Refresh
                </button>
              )
            }
            testId="customers-empty"
          />
        ) : (
          <GlassCard testId="customers-table">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ minWidth: 260 }}>Customer</th>
                    <th>Type</th>
                    <th className="d-none d-lg-table-cell">Contact</th>
                    <th className="text-end">Credit</th>
                    <th className="text-end" style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="fw-semibold">{c.name}</div>
                          {c.isActive ? (
                            <span className="badge rounded-pill text-bg-success-subtle border">
                              <BadgeCheck className="w-3 h-3 me-1" />
                              Active
                            </span>
                          ) : (
                            <span className="badge rounded-pill text-bg-secondary-subtle border">Inactive</span>
                          )}
                        </div>
                        <div className="text-muted small">{c.address ?? "—"}</div>
                      </td>
                      <td>
                        <span className="badge rounded-pill text-bg-light border">{c.customerType}</span>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <div>{c.phone ?? "—"}</div>
                        <div className="text-muted small">{c.email ?? "—"}</div>
                      </td>
                      <td className="text-end fw-semibold">{money(c.creditLimit)}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                            onClick={() => openEdit(c.id)}
                            disabled={!canManage}
                            data-testid={`customers-edit-${c.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="d-none d-lg-inline">Edit</span>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2"
                            onClick={() => askDelete(c.id)}
                            disabled={!isAdmin}
                            data-testid={`customers-delete-${c.id}`}
                            title={isAdmin ? "Delete customer" : "Admins only"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
        <DialogContent className="sm:max-w-2xl" data-testid="customers-create-dialog">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label">Name</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} data-testid="customer-form-name" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.customerType} onChange={(e) => setForm((p) => ({ ...p, customerType: e.target.value }))} data-testid="customer-form-type">
                <option value="customer">customer</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone ?? ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} data-testid="customer-form-phone" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Email</label>
              <input className="form-control" value={form.email ?? ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} data-testid="customer-form-email" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Credit limit</label>
              <input type="number" step="0.01" className="form-control" value={form.creditLimit} onChange={(e) => setForm((p) => ({ ...p, creditLimit: Number(e.target.value) }))} data-testid="customer-form-credit" />
            </div>

            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} value={form.address ?? ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} data-testid="customer-form-address" />
            </div>

            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} data-testid="customer-form-notes" />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-1">
              <button className="btn btn-outline-primary" onClick={() => setCreateOpen(false)} data-testid="customer-form-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen" onClick={submitCreate} disabled={createMutation.isPending} data-testid="customer-form-submit">
                {createMutation.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl" data-testid="customers-edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label">Name</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} data-testid="customer-edit-name" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.customerType} onChange={(e) => setForm((p) => ({ ...p, customerType: e.target.value }))} data-testid="customer-edit-type">
                <option value="customer">customer</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone ?? ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} data-testid="customer-edit-phone" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Email</label>
              <input className="form-control" value={form.email ?? ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} data-testid="customer-edit-email" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Credit limit</label>
              <input type="number" step="0.01" className="form-control" value={form.creditLimit} onChange={(e) => setForm((p) => ({ ...p, creditLimit: Number(e.target.value) }))} data-testid="customer-edit-credit" />
            </div>

            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} value={form.address ?? ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} data-testid="customer-edit-address" />
            </div>

            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} data-testid="customer-edit-notes" />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-1">
              <button className="btn btn-outline-primary" onClick={() => setEditOpen(false)} data-testid="customer-edit-cancel">
                Cancel
              </button>
              <button className="btn btn-primary pb-sheen" onClick={submitEdit} disabled={updateMutation.isPending} data-testid="customer-edit-submit">
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete this customer?"
        description="If they have orders, deletion may fail. Consider marking inactive instead."
        confirmText={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={confirmDelete}
        testId="customers-delete-confirm"
      />
    </AppShell>
  );
}
