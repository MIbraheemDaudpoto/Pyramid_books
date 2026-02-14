import { useRoute, useLocation } from "wouter";
import { useOrder } from "@/hooks/use-orders";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { ArrowLeft, Download, FileText, Package, Calendar, Tag, Info } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { useEffect } from "react";
import { formatCurrency, cn } from "@/lib/utils";

const statusConfig: Record<string, { color: string; icon: any }> = {
  pending: { color: "bg-warning text-dark", icon: Package },
  draft: { color: "bg-secondary text-white", icon: FileText },
  confirmed: { color: "bg-info text-white", icon: Info },
  shipped: { color: "bg-primary text-white", icon: Package },
  delivered: { color: "bg-success text-white", icon: Package },
  finalized: { color: "bg-primary text-white", icon: FileText },
  cancelled: { color: "bg-danger text-white", icon: Tag },
};

export default function StoreOrderDetail() {
  const [, params] = useRoute("/store/orders/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useOrder(id);

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

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
      <div className="container py-4">
        <SectionHeader title="Order Not Found" subtitle="This order could not be loaded." />
        <GlassCard className="text-center py-5 mt-4">
          <div className="mb-4">
            <Package className="w-16 h-16 text-muted mx-auto opacity-20" />
          </div>
          <h4 className="fw-bold">We couldn't find that order</h4>
          <p className="text-muted mb-4">{error ? (error as Error).message : "The order ID might be incorrect or you don't have permission to view it."}</p>
          <button className="btn btn-primary" onClick={() => setLocation("/store/orders")}>
            <ArrowLeft className="w-4 h-4 me-2" />
            Back to Orders
          </button>
        </GlassCard>
      </div>
    );
  }

  const discountPct = Number(data.discountPercentage || 0);
  const currentStatus = data.status ?? "pending";
  const { color: statusColor, icon: StatusIcon } = statusConfig[currentStatus] || statusConfig.pending;

  return (
    <div className="pb-5">
      <SectionHeader
        title={`Order #${data.orderNo}`}
        subtitle={
          <div className="d-flex align-items-center gap-3 mt-1">
            <span className="d-inline-flex align-items-center gap-1">
              <Calendar className="w-3 h-3 text-muted" />
              {data.orderDate ? new Date(data.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
            </span>
            <span className={cn("badge rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1", statusColor)}>
              <StatusIcon className="w-3 h-3" />
              {currentStatus.toUpperCase()}
            </span>
          </div>
        }
        right={
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary border-2 d-inline-flex align-items-center gap-2"
              onClick={() => setLocation("/store/orders")}
              data-testid="back-to-orders"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              className="btn btn-primary pb-sheen d-inline-flex align-items-center gap-2 px-4 shadow-sm"
              onClick={() => generateInvoicePDF(data)}
              data-testid="download-invoice-btn"
            >
              <Download className="w-4 h-4" />
              Invoice
            </button>
          </div>
        }
      />

      <div className="row g-4">
        <div className="col-lg-8">
          <GlassCard className="overflow-hidden border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 px-4 py-3">
              <h6 className="fw-bold mb-0">Order Items</h6>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" data-testid="order-items-table">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 border-0 text-muted small text-uppercase fw-bold">#</th>
                    <th className="py-3 border-0 text-muted small text-uppercase fw-bold">Book Title</th>
                    <th className="py-3 border-0 text-muted small text-uppercase fw-bold text-center">Qty</th>
                    <th className="py-3 border-0 text-muted small text-uppercase fw-bold text-end">Unit Price</th>
                    {discountPct > 0 && <th className="py-3 border-0 text-muted small text-uppercase fw-bold text-end">Discount</th>}
                    <th className="px-4 py-3 border-0 text-muted small text-uppercase fw-bold text-end">Line Total</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {data.items.map((item, idx) => {
                    const unitPrice = Number(item.unitPrice);
                    const discountAmount = discountPct > 0 ? (unitPrice * item.qty * discountPct) / 100 : 0;
                    return (
                      <tr key={item.id} data-testid={`order-item-row-${item.id}`} className="border-bottom-0">
                        <td className="px-4 py-3 text-muted">{idx + 1}</td>
                        <td className="py-3">
                          <div className="fw-bold text-dark">{item.book.title}</div>
                          {item.book.author && <div className="text-muted small">{item.book.author}</div>}
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-light text-dark border fw-normal px-2 py-1">{item.qty}</span>
                        </td>
                        <td className="py-3 text-end">{formatCurrency(unitPrice)}</td>
                        {discountPct > 0 && (
                          <td className="py-3 text-end text-success fw-medium" data-testid={`order-item-discount-${item.id}`}>
                            {discountPct}% <span className="d-block small text-muted">(-{formatCurrency(discountAmount)})</span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-end fw-bold text-primary">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data.notes && (
              <div className="m-4 p-4 bg-light rounded-4 border-start border-4 border-primary">
                <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-2">
                  <Info className="w-4 h-4" />
                  <span>Order Notes</span>
                </div>
                <div className="text-muted">{data.notes}</div>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="col-lg-4">
          <GlassCard className="border-0 shadow-sm sticky-top" style={{ top: '1rem' }}>
            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Order Summary
            </h6>

            <div className="vstack gap-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Subtotal</span>
                <span className="fw-semibold">{formatCurrency(data.subtotal)}</span>
              </div>

              {discountPct > 0 && (
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted d-flex align-items-center gap-1">
                    Discount <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">{discountPct}%</span>
                  </span>
                  <span className="fw-bold text-success">-{formatCurrency(data.discount)}</span>
                </div>
              )}

              {Number(data.tax) > 0 && (
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Tax</span>
                  <span className="fw-semibold">{formatCurrency(data.tax)}</span>
                </div>
              )}

              <div className="my-1 border-top border-dashed"></div>

              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div className="fw-bold text-dark">Grand Total</div>
                  <div className="text-muted small">Including all taxes & discounts</div>
                </div>
                <div className="text-end">
                  <span className="fw-bold fs-3 text-primary d-block" data-testid="order-total" style={{ letterSpacing: '-0.5px' }}>
                    {formatCurrency(data.total)}
                  </span>
                </div>
              </div>

              <div className="alert alert-info border-0 rounded-4 p-3 mb-0 mt-2 d-flex gap-3 shadow-none bg-info-subtle">
                <Info className="w-5 h-5 text-info shrink-0 mt-1" />
                <div className="small text-info-emphasis opacity-90">
                  <strong className="d-block mb-1">Price Disclaimer</strong>
                  Final pricing will be confirmed after internal review. If you have any questions, please contact support.
                </div>
              </div>

              <button
                className="btn btn-primary pb-sheen w-100 py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mt-2"
                onClick={() => generateInvoicePDF(data)}
                data-testid="download-invoice-btn-sidebar"
              >
                <Download className="w-5 h-5" />
                Download PDF Invoice
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
