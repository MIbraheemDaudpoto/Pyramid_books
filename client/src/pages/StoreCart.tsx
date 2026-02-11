import { useState } from "react";
import { useCart, useUpdateCartItem, useRemoveCartItem, useCheckout } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { ShoppingCart, Trash2, Minus, Plus, CreditCard } from "lucide-react";

export default function StoreCart() {
  const { data: cart = [], isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const checkout = useCheckout();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState("");

  const subtotal = cart.reduce((sum, item) => sum + Number(item.book.unitPrice) * item.qty, 0);

  const handleCheckout = () => {
    checkout.mutate(notes || undefined, {
      onSuccess: (order: any) => {
        toast({ title: "Order placed!", description: `Order #${order.id} has been created.` });
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
      <SectionHeader title="Shopping Cart" subtitle={`${cart.length} item${cart.length !== 1 ? "s" : ""} in your cart`} />

      {cart.length === 0 ? (
        <GlassCard className="text-center py-5">
          <ShoppingCart className="text-muted mx-auto mb-3" style={{ width: 48, height: 48 }} />
          <h5 className="text-muted">Your cart is empty</h5>
          <p className="text-muted small mb-3">Browse our catalog to find books you'd like to order.</p>
          <button
            className="btn btn-primary pb-sheen"
            onClick={() => setLocation("/store")}
            data-testid="browse-books-btn"
          >
            Browse Books
          </button>
        </GlassCard>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <GlassCard>
              <div className="table-responsive">
                <table className="table table-hover mb-0" data-testid="cart-table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th className="text-center" style={{ width: 140 }}>Quantity</th>
                      <th className="text-end" style={{ width: 100 }}>Price</th>
                      <th className="text-end" style={{ width: 100 }}>Total</th>
                      <th style={{ width: 48 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.id} data-testid={`cart-item-${item.id}`}>
                        <td>
                          <div className="fw-semibold" data-testid={`cart-item-title-${item.id}`}>{item.book.title}</div>
                          {item.book.author && <div className="text-muted small">{item.book.author}</div>}
                        </td>
                        <td>
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              disabled={item.qty <= 1 || updateItem.isPending}
                              onClick={() => updateItem.mutate({ id: item.id, qty: item.qty - 1 })}
                              data-testid={`cart-decrease-${item.id}`}
                            >
                              <Minus style={{ width: 14, height: 14 }} />
                            </button>
                            <span className="mx-2 fw-semibold" data-testid={`cart-qty-${item.id}`}>{item.qty}</span>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              disabled={updateItem.isPending}
                              onClick={() => updateItem.mutate({ id: item.id, qty: item.qty + 1 })}
                              data-testid={`cart-increase-${item.id}`}
                            >
                              <Plus style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </td>
                        <td className="text-end">${Number(item.book.unitPrice).toFixed(2)}</td>
                        <td className="text-end fw-semibold" data-testid={`cart-item-total-${item.id}`}>
                          ${(Number(item.book.unitPrice) * item.qty).toFixed(2)}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={removeItem.isPending}
                            onClick={() => removeItem.mutate(item.id)}
                            data-testid={`cart-remove-${item.id}`}
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
          </div>

          <div className="col-lg-4">
            <GlassCard>
              <h5 className="fw-bold mb-3">Order Summary</h5>

              <div className="d-flex justify-content-between gap-2 mb-2">
                <span className="text-muted">Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span className="fw-semibold" data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between gap-2 mb-3">
                <span className="fw-bold">Total</span>
                <span className="fw-bold fs-5 text-primary" data-testid="cart-total">${subtotal.toFixed(2)}</span>
              </div>

              <div className="alert alert-info small mb-3 d-flex align-items-start gap-2" role="alert" data-testid="cart-discount-disclaimer">
                <i className="bi bi-info-circle-fill mt-1 flex-shrink-0"></i>
                <span>Discount is given by only Company, so this is not the final bill. Final pricing will be confirmed after order review.</span>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted">Order Notes (optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special instructions..."
                  data-testid="cart-notes"
                />
              </div>

              <button
                className="btn btn-primary pb-sheen w-100 d-flex align-items-center justify-content-center gap-2"
                disabled={checkout.isPending}
                onClick={handleCheckout}
                data-testid="checkout-btn"
              >
                {checkout.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard style={{ width: 16, height: 16 }} />
                    Place Order
                  </>
                )}
              </button>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
