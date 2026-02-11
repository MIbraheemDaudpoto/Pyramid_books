import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { OrdersListResponse, OrderWithItemsResponse } from "@shared/schema";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { Eye, Package, Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { buildUrl } from "@shared/routes";

export default function StoreOrders() {
  const { data: orders = [], isLoading } = useQuery<OrdersListResponse>({ queryKey: ["/api/orders"] });

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const url = buildUrl("/api/orders/:id", { id: orderId });
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
      <SectionHeader title="My Orders" subtitle="View your order history" />

      {orders.length === 0 ? (
        <GlassCard className="text-center py-5">
          <Package className="text-muted mx-auto mb-3" style={{ width: 48, height: 48 }} />
          <h5 className="text-muted">No orders yet</h5>
          <p className="text-muted small">Your orders will appear here after you place them.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="table-responsive">
            <table className="table table-hover mb-0" data-testid="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-end">Discount</th>
                  <th className="text-end">Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusBadge: Record<string, string> = {
                    pending: "bg-warning text-dark",
                    confirmed: "bg-info text-white",
                    shipped: "bg-primary",
                    delivered: "bg-success",
                    cancelled: "bg-danger",
                  };
                  return (
                    <tr key={order.id} data-testid={`order-row-${order.id}`}>
                      <td className="fw-semibold" data-testid={`order-id-${order.id}`}>#{order.id}</td>
                      <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {order.itemCount ?? "-"} item{(order.itemCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="text-end">${Number(order.subtotal ?? 0).toFixed(2)}</td>
                      <td className="text-end">
                        {Number(order.discount ?? 0) > 0 ? (
                          <span className="text-success">
                            -${Number(order.discount).toFixed(2)}
                            {order.discountPercentage ? ` (${order.discountPercentage}%)` : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-end fw-bold">${Number(order.total ?? 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${statusBadge[order.status ?? "pending"] ?? "bg-secondary"}`}>
                          {order.status ?? "pending"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          <Link
                            href={`/store/orders/${order.id}`}
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            data-testid={`view-order-${order.id}`}
                          >
                            <Eye style={{ width: 14, height: 14 }} />
                            View
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                            onClick={() => handleDownloadInvoice(order.id)}
                            data-testid={`download-invoice-${order.id}`}
                          >
                            <Download style={{ width: 14, height: 14 }} />
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
