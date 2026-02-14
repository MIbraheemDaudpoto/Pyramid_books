import { useState } from "react";
import { useCart, useUpdateCartItem, useRemoveCartItem, useCheckout } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, Info, BookOpen, ChevronRight, AlertCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export default function StoreCart() {
  const { data: cart = [], isLoading, error } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const checkout = useCheckout();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState("");

  const subtotal = cart.reduce((sum, item) => sum + Number(item.book.unitPrice) * item.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = () => {
    checkout.mutate(notes || undefined, {
      onSuccess: (order: any) => {
        toast({ title: "Order placed!", description: `Order #${order.orderNo ?? order.id} has been created.` });
        setLocation("/store/orders");
      },
      onError: (err: any) => {
        toast({ title: "Checkout failed", description: err.message || "Could not complete checkout.", variant: "destructive" });
      },
    });
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
      <SectionHeader
        title="My Shopping Cart"
        subtitle={cart.length > 0 ? `You have ${totalItems} items ready for checkout.` : "Your selection is currently empty."}
      />

      {error ? (
        <GlassCard className="border-danger/20 text-center py-5">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-20" />
          <h5 className="fw-bold text-danger">Failed to load cart</h5>
          <p className="text-secondary">{(error as Error).message}</p>
          <button className="btn btn-outline-danger mt-2 px-4" onClick={() => window.location.reload()}>Retry</button>
        </GlassCard>
      ) : cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-12 h-12 text-muted opacity-20" />}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet. Explore our catalog to find great books."
          action={
            <button
              className="btn btn-primary pb-sheen px-4 py-2"
              onClick={() => setLocation("/store")}
              data-testid="browse-books-btn"
            >
              Browse Catalog
            </button>
          }
        />
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <GlassCard testId="cart-table" className="border-0 shadow-sm overflow-hidden p-0 mb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr className="text-muted small border-0">
                      <th className="px-4 py-3 border-0 text-uppercase fw-bold">Book Details</th>
                      <th className="py-3 border-0 text-uppercase fw-bold text-center" style={{ width: 160 }}>Quantity</th>
                      <th className="py-3 border-0 text-uppercase fw-bold text-end" style={{ width: 120 }}>Unit Price</th>
                      <th className="py-3 border-0 text-uppercase fw-bold text-end" style={{ width: 120 }}>Total</th>
                      <th className="px-4 py-3 border-0" style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody className="border-0">
                    {cart.map((item) => (
                      <tr key={item.id} className="border-0">
                        <td className="px-4 py-3 border-bottom-0">
                          <div className="d-flex align-items-center gap-3">
                            <div className="p-2 bg-primary-subtle rounded-3 text-primary shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="fw-bold text-dark" data-testid={`cart-item-title-${item.id}`}>{item.book.title}</div>
                              {item.book.author && <div className="text-muted small">by {item.book.author}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 border-bottom-0">
                          <div className="d-flex align-items-center justify-content-center">
                            <div className="input-group input-group-sm bg-light rounded-pill p-1 border" style={{ width: 'fit-content' }}>
                              <button
                                className="btn btn-icon btn-ghost-secondary rounded-circle p-1"
                                disabled={item.qty <= 1 || updateItem.isPending}
                                onClick={() => updateItem.mutate({ id: item.id, qty: item.qty - 1 })}
                                data-testid={`cart-decrease-${item.id}`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 fw-bold align-self-center text-dark" data-testid={`cart-qty-${item.id}`} style={{ minWidth: '40px', textAlign: 'center' }}>
                                {item.qty}
                              </span>
                              <button
                                className="btn btn-icon btn-ghost-secondary rounded-circle p-1"
                                disabled={updateItem.isPending}
                                onClick={() => updateItem.mutate({ id: item.id, qty: item.qty + 1 })}
                                data-testid={`cart-increase-${item.id}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 border-bottom-0 text-end">
                          <span className="text-muted">{formatCurrency(item.book.unitPrice)}</span>
                        </td>
                        <td className="py-3 border-bottom-0 text-end">
                          <span className="fw-bold text-dark" data-testid={`cart-item-total-${item.id}`}>
                            {formatCurrency(Number(item.book.unitPrice) * item.qty)}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-bottom-0 text-end">
                          <button
                            className="btn btn-icon btn-ghost-danger rounded-circle"
                            disabled={removeItem.isPending}
                            onClick={() => removeItem.mutate(item.id)}
                            data-testid={`cart-remove-${item.id}`}
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <div className="mb-4">
              <label className="form-label fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                Order Notes
                <span className="badge bg-light text-muted fw-normal border">Optional</span>
              </label>
              <textarea
                className="form-control border-0 shadow-sm bg-white p-3 rounded-4"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add special instructions, delivery preferences, or any other notes for this order..."
                data-testid="cart-notes"
                style={{ resize: 'none' }}
              />
            </div>
          </div>

          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '2rem' }}>
              <GlassCard testId="order-summary" className="border-0 shadow-sm p-4">
                <h5 className="fw-bold mb-4 text-dark border-bottom pb-3">Order Summary</h5>

                <div className="vstack gap-3 mb-4">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Subtotal ({totalItems} items)</span>
                    <span className="fw-bold text-dark" data-testid="cart-subtotal">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Shipping</span>
                    <span className="text-success fw-bold">Calculated later</span>
                  </div>
                </div>

                <div className="p-3 bg-primary-subtle rounded-4 text-primary border border-primary-subtle mb-4 d-flex gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="small mb-0 leading-relaxed">
                    Final discounts and taxes will be applied by the administration after order review.
                  </p>
                </div>

                <div className="d-flex justify-content-between align-items-end mb-4 pt-4 border-top">
                  <span className="fw-bold text-dark fs-5">Estimated Total</span>
                  <div className="text-end">
                    <div className="fw-black text-primary fs-3 leading-none" data-testid="cart-total">
                      {formatCurrency(subtotal)}
                    </div>
                    <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Excluding tax & shipping</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary pb-sheen w-100 d-flex align-items-center justify-content-center gap-2 py-3 fs-6 fw-bold shadow-sm rounded-4"
                  disabled={checkout.isPending}
                  onClick={handleCheckout}
                  data-testid="checkout-btn"
                >
                  {checkout.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Processing Order…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Place Order Now
                    </>
                  )}
                </button>

                <button
                  className="btn btn-link text-muted w-100 mt-3 d-flex align-items-center justify-content-center gap-1 text-decoration-none small"
                  onClick={() => setLocation("/store")}
                >
                  Continue Browsing
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </GlassCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
