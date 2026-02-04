import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { BooksQueryParams, CreateBookRequest, UpdateBookRequest } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

function toSearchParams(input?: BooksQueryParams) {
  const sp = new URLSearchParams();
  if (!input) return sp;
  if (input.q) sp.set("q", input.q);
  if (input.category) sp.set("category", input.category);
  if (typeof input.lowStock === "boolean") sp.set("lowStock", input.lowStock ? "true" : "false");
  return sp;
}

export function useBooks(params?: BooksQueryParams) {
  const key = [api.books.list.path, params?.q || "", params?.category || "", params?.lowStock ? "1" : "0"] as const;
  return useQuery({
    queryKey: key as unknown as string[],
    queryFn: async () => {
      const sp = toSearchParams(params);
      const url = sp.toString() ? `${api.books.list.path}?${sp}` : api.books.list.path;
      // Validate query input (string boolean for lowStock per manifest)
      api.books.list.input?.parse({
        ...(params?.q ? { q: params.q } : {}),
        ...(params?.category ? { category: params.category } : {}),
        ...(typeof params?.lowStock === "boolean" ? { lowStock: params.lowStock ? "true" : "false" } : {}),
      });

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.books.list.responses[200], await res.json(), "books.list");
    },
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBookRequest) => {
      const validated = api.books.create.input.parse(data);
      const res = await fetch(api.books.create.path, {
        method: api.books.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.books.create.responses[400], await res.json(), "books.create.400");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return parseWithLogging(api.books.create.responses[201], await res.json(), "books.create.201");
    },
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === api.books.list.path }),
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateBookRequest }) => {
      const validated = api.books.update.input.parse(updates);
      const url = buildUrl(api.books.update.path, { id });
      const res = await fetch(url, {
        method: api.books.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.books.update.responses[400], await res.json(), "books.update.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.books.update.responses[404], await res.json(), "books.update.404");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return parseWithLogging(api.books.update.responses[200], await res.json(), "books.update.200");
    },
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === api.books.list.path }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.books.delete.path, { id });
      const res = await fetch(url, {
        method: api.books.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) {
          const err = parseWithLogging(api.books.delete.responses[404], await res.json(), "books.delete.404");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === api.books.list.path }),
  });
}
