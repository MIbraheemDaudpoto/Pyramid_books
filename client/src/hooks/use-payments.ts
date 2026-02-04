import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { CreatePaymentRequest } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function usePayments() {
  return useQuery({
    queryKey: [api.payments.list.path],
    queryFn: async () => {
      const res = await fetch(api.payments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.payments.list.responses[200], await res.json(), "payments.list");
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      const validated = api.payments.create.input.parse(data);
      const res = await fetch(api.payments.create.path, {
        method: api.payments.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.payments.create.responses[400], await res.json(), "payments.create.400");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return parseWithLogging(api.payments.create.responses[201], await res.json(), "payments.create.201");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [api.payments.list.path] });
      await qc.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}
