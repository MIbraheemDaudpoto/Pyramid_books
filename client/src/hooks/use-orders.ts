import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateOrderRequest, UpdateOrderStatusRequest } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useOrders() {
  return useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await fetch(api.orders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.orders.list.responses[200], await res.json(), "orders.list");
    },
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.orders.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.orders.get.responses[200], await res.json(), "orders.get");
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const validated = api.orders.create.input.parse(data);
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.orders.create.responses[400], await res.json(), "orders.create.400");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return parseWithLogging(api.orders.create.responses[201], await res.json(), "orders.create.201");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [api.orders.list.path] });
      await qc.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: UpdateOrderStatusRequest["status"] }) => {
      const validated = api.orders.updateStatus.input.parse({ status });
      const url = buildUrl(api.orders.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.orders.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.orders.updateStatus.responses[400], await res.json(), "orders.status.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.orders.updateStatus.responses[404], await res.json(), "orders.status.404");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return parseWithLogging(api.orders.updateStatus.responses[200], await res.json(), "orders.status.200");
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: [api.orders.list.path] });
      await qc.invalidateQueries({ queryKey: [api.orders.get.path, vars.id] });
      await qc.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}
