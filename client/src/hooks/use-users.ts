import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export type UsersListItem = z.infer<typeof api.users.list.responses[200]>[number];
export type UpdateUserInput = z.infer<typeof api.users.update.input>;
export type UpdateUserResponse = z.infer<typeof api.users.update.responses[200]>;

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.users.list.responses[200], await res.json(), "users.list");
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUserInput }) => {
      const validated = api.users.update.input.parse(updates);
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.users.update.responses[400], await res.json(), "users.update.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.users.update.responses[404], await res.json(), "users.update.404");
          throw new Error(err.message);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }

      return parseWithLogging(api.users.update.responses[200], await res.json(), "users.update.200");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [api.users.list.path] });
      await qc.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}
