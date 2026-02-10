import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CartResponse } from "@shared/schema";

export function useCart() {
  return useQuery<CartResponse>({
    queryKey: ["/api/cart"],
  });
}

export function useCartCount(): number {
  const { data } = useCart();
  return data?.reduce((sum, item) => sum + item.qty, 0) ?? 0;
}

export function useAddToCart() {
  return useMutation({
    mutationFn: async (input: { bookId: number; qty?: number }) => {
      const res = await apiRequest("POST", "/api/cart", input);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });
}

export function useUpdateCartItem() {
  return useMutation({
    mutationFn: async ({ id, qty }: { id: number; qty: number }) => {
      const res = await apiRequest("PATCH", `/api/cart/${id}`, { qty });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });
}

export function useRemoveCartItem() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/cart/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (notes?: string) => {
      const res = await apiRequest("POST", "/api/cart/checkout", notes ? { notes } : {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
  });
}
