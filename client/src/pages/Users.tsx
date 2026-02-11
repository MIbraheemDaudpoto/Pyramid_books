import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useMe } from "@/hooks/use-me";
import { useUpdateUser, useUsers } from "@/hooks/use-users";
import { useCustomers } from "@/hooks/use-customers";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Role } from "@shared/schema";
import { Shield, Users as UsersIcon, BadgeCheck, Ban, Plus, UserPlus, KeyRound, Copy, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

function PasswordResetRequests() {
  const { toast } = useToast();
  const { data: resets = [], isLoading } = useQuery<Array<{
    id: number;
    token: string;
    userEmail: string | null;
    userName: string | null;
    expiresAt: string;
    createdAt: string;
  }>>({ queryKey: ["/api/admin/password-resets"] });

  function copyResetLink(token: string) {
    const url = `${window.location.origin}/reset-password?token=${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast({ title: "Copied", description: "Reset link copied to clipboard. Share it with the user." }),
      () => toast({ title: "Error", description: "Failed to copy link", variant: "destructive" }),
    );
  }

  if (isLoading) return null;
  if (resets.length === 0) return null;

  return (
    <GlassCard className="mb-4" testId="password-reset-requests">
      <h5 className="mb-3 d-flex align-items-center gap-2">
        <KeyRound style={{ width: 20, height: 20 }} className="text-warning" />
        Pending Password Resets
        <span className="badge bg-warning text-dark rounded-pill">{resets.length}</span>
      </h5>
      <p className="text-muted small mb-3">
        Users who requested a password reset. Copy the reset link and share it with them directly.
      </p>
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr className="text-muted small">
              <th>User</th>
              <th>Requested</th>
              <th>Expires</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {resets.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="fw-semibold">{r.userName || "—"}</div>
                  <div className="text-muted small">{r.userEmail}</div>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-1 text-muted small">
                    <Clock style={{ width: 14, height: 14 }} />
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </td>
                <td>
                  <span className="text-muted small">{new Date(r.expiresAt).toLocaleString()}</span>
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    onClick={() => copyResetLink(r.token)}
                    data-testid={`copy-reset-link-${r.id}`}
                  >
                    <Copy style={{ width: 14, height: 14 }} />
                    Copy Reset Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

export default function UsersPage() {
  const { toast } = useToast();
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin";

  const usersQuery = useUsers();
  const customersQuery = useCustomers();
  const update = useUpdateUser();

  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<string>("salesman");

  const createUser = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; password: string; role: string }) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreate(false);
      setCreateEmail("");
      setCreateFirstName("");
      setCreateLastName("");
      setCreatePassword("");
      setCreateRole("salesman");
      toast({ title: "User created", description: "New user account has been created." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to create user", variant: "destructive" }),
  });

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
        subtitle="Manage user accounts, assign roles, and link customers."
        badge={
          <span className="badge rounded-pill text-bg-light border">
            <Shield className="w-3 h-3 me-1" />
            admin only
          </span>
        }
        right={
          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowCreate(!showCreate)}
              data-testid="button-create-user"
            >
              <UserPlus style={{ width: 16, height: 16 }} />
              Create User
            </button>
          </div>
        }
      />

      {!isAdmin ? (
        <div className="alert alert-warning" role="alert" data-testid="users-noaccess">
          You do not have access to this page.
        </div>
      ) : (
        <>
          {showCreate && (
            <GlassCard className="mb-4 pb-enter">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <UserPlus style={{ width: 20, height: 20 }} className="text-primary" />
                Create New User
              </h5>
              <form onSubmit={(e) => {
                e.preventDefault();
                createUser.mutate({ email: createEmail, firstName: createFirstName, lastName: createLastName, password: createPassword, role: createRole });
              }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">First Name *</label>
                    <input type="text" className="form-control" value={createFirstName} onChange={(e) => setCreateFirstName(e.target.value)} required data-testid="input-create-first-name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Last Name *</label>
                    <input type="text" className="form-control" value={createLastName} onChange={(e) => setCreateLastName(e.target.value)} required data-testid="input-create-last-name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email *</label>
                    <input type="email" className="form-control" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required data-testid="input-create-email" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Password *</label>
                    <input type="password" className="form-control" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={6} data-testid="input-create-password" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Role *</label>
                    <select className="form-select" value={createRole} onChange={(e) => setCreateRole(e.target.value)} data-testid="select-create-role">
                      <option value="salesman">Salesman</option>
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={createUser.isPending} data-testid="button-submit-create-user">
                    {createUser.isPending ? <span className="spinner-border spinner-border-sm" /> : <Plus style={{ width: 16, height: 16 }} />}
                    Create
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                </div>
              </form>
            </GlassCard>
          )}

          <PasswordResetRequests />

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
                        <th className="d-none d-xl-table-cell">Customer Link</th>
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
                            <span className={`badge rounded-pill border ${u.role === "admin" ? "text-bg-primary" : u.role === "salesman" ? "text-bg-info" : "text-bg-light"}`}>{u.role}</span>
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
                              disabled={u.role !== "customer"}
                              title={u.role !== "customer" ? "Only for customer role" : "Link customer"}
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
                                <option value="admin">Admin</option>
                                <option value="salesman">Salesman</option>
                                <option value="customer">Customer</option>
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
                  Tip: set a user to <span className="fw-semibold">customer</span> to enable linking them to a customer record.
                </div>
              </GlassCard>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
