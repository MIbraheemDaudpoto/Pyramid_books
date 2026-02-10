import { useState } from "react";
import {
  useDiscountRules,
  useCreateDiscountRule,
  useDeleteDiscountRule,
} from "@/hooks/use-discounts";
import { useToast } from "@/hooks/use-toast";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Percent, Plus, Trash2, Tag } from "lucide-react";

export default function DiscountRules() {
  const { data: rules = [], isLoading } = useDiscountRules();
  const createRule = useCreateDiscountRule();
  const deleteRule = useDeleteDiscountRule();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    ruleName: "",
    discountPercentage: "",
    minOrderAmount: "",
    validFrom: "",
    validTo: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createRule.mutate(
      {
        ruleName: form.ruleName,
        discountPercentage: parseFloat(form.discountPercentage),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        isActive: true,
      },
      {
        onSuccess: () => {
          toast({ title: "Rule created", description: "Discount rule has been created." });
          setForm({ ruleName: "", discountPercentage: "", minOrderAmount: "", validFrom: "", validTo: "" });
          setShowForm(false);
        },
        onError: (err: any) =>
          toast({ title: "Error", description: err.message || "Failed to create rule", variant: "destructive" }),
      },
    );
  };

  const handleDelete = () => {
    if (deleteId == null) return;
    deleteRule.mutate(deleteId, {
      onSuccess: () => {
        toast({ title: "Rule deleted", description: "Discount rule has been removed." });
        setDeleteId(null);
      },
      onError: (err: any) =>
        toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" }),
    });
  };

  return (
    <AppShell>
      <SectionHeader
        title="Discount Rules"
        subtitle="Manage automatic discount rules applied during checkout"
        right={
          <button
            className="btn btn-primary pb-sheen d-flex align-items-center gap-2"
            onClick={() => setShowForm(!showForm)}
            data-testid="new-discount-rule-btn"
          >
            <Plus style={{ width: 16, height: 16 }} />
            New Rule
          </button>
        }
      />

      {showForm && (
        <GlassCard className="mb-4">
          <form onSubmit={handleCreate} data-testid="discount-rule-form">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Rule Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.ruleName}
                  onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
                  placeholder="e.g. 10% on orders over $500"
                  data-testid="rule-name-input"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Discount %</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.discountPercentage}
                  onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                  placeholder="10"
                  data-testid="discount-pct-input"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Min Order $</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="0"
                  data-testid="min-amount-input"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Valid From</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  data-testid="valid-from-input"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Valid To</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.validTo}
                  onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                  data-testid="valid-to-input"
                />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary pb-sheen"
                disabled={createRule.isPending}
                data-testid="save-rule-btn"
              >
                {createRule.isPending ? "Creating..." : "Create Rule"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : rules.length === 0 ? (
        <GlassCard className="text-center py-5">
          <Tag className="text-muted mx-auto mb-3" style={{ width: 48, height: 48 }} />
          <h5 className="text-muted">No discount rules</h5>
          <p className="text-muted small">Create discount rules to automatically apply discounts at checkout.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="table-responsive">
            <table className="table table-hover mb-0" data-testid="discount-rules-table">
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th className="text-center">Discount %</th>
                  <th className="text-end">Min Order</th>
                  <th>Valid From</th>
                  <th>Valid To</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} data-testid={`discount-rule-${rule.id}`}>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center gap-2">
                        <Percent style={{ width: 14, height: 14 }} className="text-primary" />
                        {rule.ruleName}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                        {rule.discountPercentage}%
                      </span>
                    </td>
                    <td className="text-end">${Number(rule.minOrderAmount ?? 0).toFixed(2)}</td>
                    <td>{rule.validFrom ? new Date(rule.validFrom).toLocaleDateString() : "No limit"}</td>
                    <td>{rule.validTo ? new Date(rule.validTo).toLocaleDateString() : "No limit"}</td>
                    <td>
                      <span className={`badge ${rule.isActive ? "bg-success" : "bg-secondary"}`}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeleteId(rule.id)}
                        data-testid={`delete-rule-${rule.id}`}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Discount Rule"
        description="Are you sure you want to delete this discount rule?"
        confirmText="Delete"
        destructive
        onConfirm={handleDelete}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
      />
    </AppShell>
  );
}
