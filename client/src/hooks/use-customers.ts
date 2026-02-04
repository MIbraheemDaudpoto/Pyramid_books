import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateCustomerRequest, UpdateCustomerRequest } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useCustomers() {
  return useQuery({
    queryKey: [api.customers.list.path],
    queryFn: async () => {
      const res = await fetch(api.customers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.customers.list.responses[200], await res.json(), "customers.list");
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const validated = api.customers.create.input.parse(data);
      const res = await fetch(api.customers.create.path, {
        method: api.customers.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.customers.create.responses[400], await res.json(), "customers.create.400");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return parseWithLogging(api.customers.create.responses[201], await res.json(), "customers.create.201");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.customers.list.path] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateCustomerRequest }) => {
      const validated = api.customers.update.input.parse(updates);
      const url = buildUrl(api.customers.update.path, { id });
      const res = await fetch(url, {
        method: api.customers.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.customers.update.responses[400], await res.json(), "customers.update.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.customers.update.responses[404], await res.json(), "customers.update.404");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return parseWithLogging(api.customers.update.responses[200], await res.json(), "customers.update.200");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.customers.list.path] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.customers.delete.path, { id });
      const res = await fetch(url, {
        method: api.customers.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) {
          const err = parseWithLogging(api.customers.delete.responses[404], await res.json(), "customers.delete.404");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.customers.list.path] }),
  });
}
