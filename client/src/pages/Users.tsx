import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useMe } from "@/hooks/use-me";
import { useUpdateUser, useUsers } from "@/hooks/use-users";
import { useCustomers } from "@/hooks/use-customers";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import type { Role } from "@shared/schema";
import { Shield, Users as UsersIcon, BadgeCheck, Ban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function UsersPage() {
  const { toast } = useToast();
  const { data: me } = useMe();
  const isAdmin = me?.role === "super_admin";

  const usersQuery = useUsers();
  const customersQuery = useCustomers();
  const update = useUpdateUser();

  useEffect(() => {
    const msg = (usersQuery.error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [usersQuery.error, toast]);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const list = usersQuery.data || [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((u) => (u.email || "").toLowerCase().includes(s) || (u.firstName || "").toLowerCase().includes(s) || (u.lastName || "").toLowerCase().includes(s) || u.role.toLowerCase().includes(s));
  }, [usersQuery.data, q]);

  function setRole(userId: string, role: Role) {
    update.mutate(
      { id: userId, updates: { role } },
      {
        onSuccess: () => toast({ title: "User updated", description: "Role changed." }),
        onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  function setActive(userId: string, isActive: boolean) {
    update.mutate(
      { id: userId, updates: { isActive } },
      {
        onSuccess: () => toast({ title: "User updated", description: isActive ? "User activated." : "User deactivated." }),
        onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  function setCustomerLink(userId: string, customerId: number | null) {
    update.mutate(
      { id: userId, updates: { customerId } },
      {
        onSuccess: () => toast({ title: "User updated", description: "Customer link updated." }),
        onError: (e) => toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  return (
    <AppShell>
      <Seo title="Users — Pyramid Books" description="Admin-only user management: roles, activation, and customer links." />

      <SectionHeader
        title="Users"
        subtitle="Admin-only controls: assign roles and (for fixed customers) link a user to a customerId."
        badge={
          <span className="badge rounded-pill text-bg-light border">
            <Shield className="w-3 h-3 me-1" />
            super_admin only
          </span>
        }
        right={
          <button
            className="btn btn-outline-primary"
            onClick={() => window.location.reload()}
            data-testid="users-refresh"
          >
            Refresh
          </button>
        }
      />

      {!isAdmin ? (
        <div className="alert alert-warning" role="alert" data-testid="users-noaccess">
          You do not have access to this page.
        </div>
      ) : (
        <>
          <GlassCard>
            <label className="form-label small text-muted">Search</label>
            <input
              className="form-control"
              placeholder="Email, name, role…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              data-testid="users-search"
            />
          </GlassCard>

          <div className="mt-4">
            {usersQuery.isLoading ? (
              <GlassCard>
                <div className="placeholder-glow">
                  <span className="placeholder col-12 rounded-3" style={{ height: 18, display: "block" }} />
                  <span className="placeholder col-10 rounded-3 mt-2" style={{ height: 18, display: "block" }} />
                </div>
              </GlassCard>
            ) : usersQuery.error ? (
              <div className="alert alert-danger" role="alert" data-testid="users-error">
                {(usersQuery.error as Error).message}
              </div>
            ) : (
              <GlassCard testId="users-table">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr className="text-muted small">
                        <th style={{ minWidth: 260 }}>User</th>
                        <th>Role</th>
                        <th className="d-none d-lg-table-cell">Status</th>
                        <th className="d-none d-xl-table-cell">Fixed customer link</th>
                        <th className="text-end" style={{ width: 280 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <UsersIcon className="w-4 h-4 text-muted" />
                              <div>
                                <div className="fw-semibold">{u.email ?? u.id}</div>
                                <div className="text-muted small">
                                  {(u.firstName || u.lastName) ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge rounded-pill text-bg-light border">{u.role}</span>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            {u.isActive ? (
                              <span className="badge rounded-pill text-bg-success-subtle border">
                                <BadgeCheck className="w-3 h-3 me-1" />
                                Active
                              </span>
                            ) : (
                              <span className="badge rounded-pill text-bg-danger-subtle border">
                                <Ban className="w-3 h-3 me-1" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="d-none d-xl-table-cell">
                            <select
                              className="form-select form-select-sm"
                              value={u.customerId ?? ""}
                              onChange={(e) => setCustomerLink(u.id, e.target.value ? Number(e.target.value) : null)}
                              data-testid={`users-link-customer-${u.id}`}
                              disabled={u.role !== "fixed_customer"}
                              title={u.role !== "fixed_customer" ? "Only for fixed_customer role" : "Link customer"}
                            >
                              <option value="">(none)</option>
                              {(customersQuery.data || []).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-end">
                            <div className="d-flex flex-wrap justify-content-end gap-2">
                              <select
                                className="form-select form-select-sm"
                                value={u.role}
                                onChange={(e) => setRole(u.id, e.target.value as Role)}
                                data-testid={`users-role-${u.id}`}
                                style={{ width: 180 }}
                              >
                                <option value="super_admin">super_admin</option>
                                <option value="salesman">salesman</option>
                                <option value="fixed_customer">fixed_customer</option>
                                <option value="local_customer">local_customer</option>
                              </select>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setActive(u.id, !u.isActive)}
                                disabled={update.isPending}
                                data-testid={`users-toggle-active-${u.id}`}
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-muted small mt-3">
                  Tip: set a user to <span className="fw-semibold">fixed_customer</span> to enable linking them to a customer record.
                </div>
              </GlassCard>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
