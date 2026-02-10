import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateStockReceiptRequest, StockReceiptsListResponse } from "@shared/schema";

export function useStockReceipts() {
  return useQuery<StockReceiptsListResponse>({
    queryKey: ["/api/stock-receipts"],
  });
}

export function useCreateStockReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStockReceiptRequest) => {
      const res = await fetch("/api/stock-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || text);
        } catch {
          throw new Error(`${res.status}: ${text}`);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/stock-receipts"] });
      qc.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("/api/books") });
    },
  });
}
