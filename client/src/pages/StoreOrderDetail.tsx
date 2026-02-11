import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { buildUrl } from "@shared/routes";
import type { OrderWithItemsResponse } from "@shared/schema";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

function money(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
}

export default function StoreOrderDetail() {
  const [, params] = useRoute("/store/orders/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<OrderWithItemsResponse>({
    queryKey: ["/api/orders", id],
    queryFn: async () => {
      const url = buildUrl("/api/orders/:id", { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    enabled: !!id,
  });

  const statusColors: Record<string, string> = {
    pending: "bg-warning text-dark",
    draft: "bg-secondary",
    confirmed: "bg-info text-white",
    shipped: "bg-primary",
    delivered: "bg-success",
    finalized: "bg-primary text-white",
    cancelled: "bg-danger",
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <SectionHeader title="Order Not Found" subtitle="This order could not be loaded." />
        <div className="alert alert-warning">
          {error ? (error as Error).message : "Order not found."}
        </div>
        <button className="btn btn-outline-primary" onClick={() => setLocation("/store/orders")} data-testid="back-to-orders">
          <ArrowLeft style={{ width: 16, height: 16 }} className="me-1" />
          Back to Orders
        </button>
      </div>
    );
  }

  const discountPct = Number(data.discountPercentage || 0);

  return (
    <div>
      <SectionHeader
        title={`Order #${data.orderNo}`}
        subtitle={`Placed on ${data.orderDate ? new Date(data.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}`}
        right={
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
              onClick={() => setLocation("/store/orders")}
              data-testid="back-to-orders"
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Back
            </button>
            <button
              className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2"
              onClick={() => generateInvoicePDF(data)}
              data-testid="download-invoice-btn"
            >
              <Download style={{ width: 16, height: 16 }} />
              Download Invoice
            </button>
          </div>
        }
      />

      <div className="row g-4">
        <div className="col-lg-8">
          <GlassCard>
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <h6 className="fw-bold mb-0">Order Items</h6>
              <span className={`badge ${statusColors[data.status ?? "pending"] ?? "bg-secondary"}`} data-testid="order-status-badge">
                {data.status ?? "pending"}
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover mb-0" data-testid="order-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Book</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Price</th>
                    {discountPct > 0 && <th className="text-end">Discount</th>}
                    <th className="text-end">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => {
                    const unitPrice = Number(item.unitPrice);
                    const discountAmount = discountPct > 0 ? (unitPrice * item.qty * discountPct) / 100 : 0;
                    return (
                      <tr key={item.id} data-testid={`order-item-row-${item.id}`}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <div className="fw-semibold">{item.book.title}</div>
                          {item.book.author && <div className="text-muted small">{item.book.author}</div>}
                        </td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-end">{money(unitPrice)}</td>
                        {discountPct > 0 && (
                          <td className="text-end text-success" data-testid={`order-item-discount-${item.id}`}>
                            {discountPct}% (-{money(discountAmount)})
                          </td>
                        )}
                        <td className="text-end fw-semibold">{money(item.lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data.notes && (
              <div className="mt-3 p-3 bg-light rounded-3">
                <div className="text-muted small fw-bold">Order Notes</div>
                <div className="mt-1 small">{data.notes}</div>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="col-lg-4">
          <GlassCard>
            <h6 className="fw-bold mb-3">Order Summary</h6>

            <div className="d-flex justify-content-between gap-2 mb-2">
              <span className="text-muted">Subtotal</span>
              <span className="fw-semibold">{money(data.subtotal)}</span>
            </div>

            {discountPct > 0 && (
              <div className="d-flex justify-content-between gap-2 mb-2">
                <span className="text-muted">Discount ({discountPct}%)</span>
                <span className="fw-semibold text-success">-{money(data.discount)}</span>
              </div>
            )}

            {Number(data.tax) > 0 && (
              <div className="d-flex justify-content-between gap-2 mb-2">
                <span className="text-muted">Tax</span>
                <span className="fw-semibold">{money(data.tax)}</span>
              </div>
            )}

            <hr />

            <div className="d-flex justify-content-between gap-2 mb-3">
              <span className="fw-bold">Total</span>
              <span className="fw-bold fs-5 text-primary" data-testid="order-total">{money(data.total)}</span>
            </div>

            <div className="alert alert-info small mb-3" data-testid="discount-disclaimer">
              Discount is given by only Company, so this is not the final bill. Final pricing will be confirmed after order review.
            </div>

            <button
              className="btn btn-primary pb-sheen w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={() => generateInvoicePDF(data)}
              data-testid="download-invoice-btn-sidebar"
            >
              <FileText style={{ width: 16, height: 16 }} />
              Download Invoice (PDF)
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
