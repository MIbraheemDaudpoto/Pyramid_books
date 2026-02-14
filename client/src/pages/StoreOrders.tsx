import { Link } from "wouter";
import type { OrderWithItemsResponse } from "@shared/schema";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import { Eye, Package, Download, Calendar, Receipt, ArrowRight, FileText, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { buildUrl, api } from "@shared/routes";
import { useOrders } from "@/hooks/use-orders";
import { formatCurrency, cn } from "@/lib/utils";

const statusConfig: Record<string, { tone: { bg: string; fg: string }; icon: any }> = {
  pending: { tone: { bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" }, icon: Clock },
  draft: { tone: { bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" }, icon: Clock },
  confirmed: { tone: { bg: "hsl(var(--accent) / .14)", fg: "hsl(var(--accent))" }, icon: FileText },
  shipped: { tone: { bg: "hsl(var(--primary) / .14)", fg: "hsl(var(--primary))" }, icon: Truck },
  delivered: { tone: { bg: "hsl(152 52% 42% / .14)", fg: "hsl(152 52% 42%)" }, icon: Package },
  finalized: { tone: { bg: "hsl(210 60% 45% / .14)", fg: "hsl(210 60% 45%)" }, icon: CheckCircle },
  cancelled: { tone: { bg: "hsl(var(--destructive) / .14)", fg: "hsl(var(--destructive))" }, icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <span
      className="badge rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1.5 border"
      style={{ background: config.tone.bg, color: config.tone.fg, borderColor: "hsl(var(--border))" }}
    >
      <Icon className="w-3 h-3" />
      <span className="text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.3px' }}>{status}</span>
    </span>
  );
}

export default function StoreOrders() {
  const { data: orders = [], isLoading, error } = useOrders();

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const url = buildUrl(api.orders.get.path, { id: orderId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load order");
      const order: OrderWithItemsResponse = await res.json();
      await generateInvoicePDF(order);
    } catch (err) {
      console.error("Invoice download error:", err);
    }
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

  return (
    <div>
      <SectionHeader title="My Orders" subtitle="Track your purchase history and order status." />

      {error ? (
        <GlassCard className="border-danger/20 text-center py-5">
          <XCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-20" />
          <h5 className="fw-bold text-danger">Error Loading Orders</h5>
          <p className="text-secondary">{(error as Error).message}</p>
          <button className="btn btn-outline-danger mt-2" onClick={() => window.location.reload()}>Retry</button>
        </GlassCard>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-muted opacity-20" />}
          title="No orders yet"
          description="Your orders will appear here after you place them in the catalog."
          action={
            <Link href="/store/catalog" className="btn btn-primary pb-sheen px-4 py-2">
              Browse Books
            </Link>
          }
        />
      ) : (
        <GlassCard testId="orders-table" className="border-0 shadow-sm overflow-hidden p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="text-muted small border-0">
                  <th className="px-4 py-3 border-0 text-uppercase fw-bold" style={{ width: '150px' }}>Order</th>
                  <th className="py-3 border-0 text-uppercase fw-bold">Date</th>
                  <th className="py-3 border-0 text-uppercase fw-bold">Items</th>
                  <th className="py-3 border-0 text-uppercase fw-bold text-end">Total</th>
                  <th className="py-3 border-0 text-uppercase fw-bold text-center">Status</th>
                  <th className="px-4 py-3 border-0 text-uppercase fw-bold text-end" style={{ width: '180px' }}></th>
                </tr>
              </thead>
              <tbody className="border-0">
                {orders.map((order) => (
                  <tr key={order.id} className="border-0">
                    <td className="px-4 py-3 border-bottom-0">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <span className="fw-bold text-dark">#{order.orderNo ?? order.id}</span>
                      </div>
                    </td>
                    <td className="py-3 border-bottom-0">
                      <div className="d-flex align-items-center gap-1 text-muted small">
                        <Calendar className="w-3.5 h-3.5" />
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="py-3 border-bottom-0">
                      <span className="badge bg-light text-dark border px-2 py-1 fw-medium">
                        {order.itemCount ?? 0} item{(order.itemCount ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-3 border-bottom-0 text-end">
                      <div className="fw-bold text-dark">{formatCurrency(order.total)}</div>
                    </td>
                    <td className="py-3 border-bottom-0 text-center">
                      <StatusBadge status={order.status ?? "pending"} />
                    </td>
                    <td className="px-4 py-3 border-bottom-0 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <Link
                          href={`/store/orders/${order.id}`}
                          className="btn btn-sm btn-icon btn-ghost-primary rounded-circle"
                          data-testid={`view-order-${order.id}`}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          className="btn btn-sm btn-icon btn-ghost-secondary rounded-circle"
                          onClick={() => handleDownloadInvoice(order.id)}
                          data-testid={`download-invoice-${order.id}`}
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
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
  );
}
