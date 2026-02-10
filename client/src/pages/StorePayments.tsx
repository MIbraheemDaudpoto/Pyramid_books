import { useQuery } from "@tanstack/react-query";
import type { PaymentsListResponse } from "@shared/schema";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { CreditCard, DollarSign } from "lucide-react";

export default function StorePayments() {
  const { data: payments = [], isLoading } = useQuery<PaymentsListResponse>({
    queryKey: ["/api/payments"],
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="My Payments" subtitle="View your payment history" />

      {payments.length === 0 ? (
        <GlassCard className="text-center py-5">
          <DollarSign className="text-muted mx-auto mb-3" style={{ width: 48, height: 48 }} />
          <h5 className="text-muted">No payments yet</h5>
          <p className="text-muted small">Your payment records will appear here.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="table-responsive">
            <table className="table table-hover mb-0" data-testid="payments-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th className="text-end">Amount</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} data-testid={`payment-row-${p.id}`}>
                    <td className="fw-semibold">{p.id}</td>
                    <td>{p.receivedAt ? new Date(p.receivedAt).toLocaleDateString() : "-"}</td>
                    <td>
                      <span className="badge bg-primary bg-opacity-10 text-primary">
                        <CreditCard style={{ width: 12, height: 12 }} className="me-1" />
                        {p.method ?? "cash"}
                      </span>
                    </td>
                    <td className="text-end fw-bold text-success">${Number(p.amount ?? 0).toFixed(2)}</td>
                    <td className="text-muted small">{p.referenceNo ?? "-"}</td>
                    <td className="text-muted small">{p.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
