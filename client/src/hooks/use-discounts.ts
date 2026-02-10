import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DiscountRule } from "@shared/schema";

export function useDiscountRules() {
  return useQuery<DiscountRule[]>({
    queryKey: ["/api/discount-rules"],
  });
}

export function useCreateDiscountRule() {
  return useMutation({
    mutationFn: async (input: {
      ruleName: string;
      discountPercentage: number;
      minOrderAmount?: number;
      validFrom?: string;
      validTo?: string;
      isActive?: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/discount-rules", input);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount-rules"] });
    },
  });
}

export function useDeleteDiscountRule() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/discount-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount-rules"] });
    },
  });
}
