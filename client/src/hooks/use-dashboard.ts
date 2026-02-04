import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useDashboard() {
  return useQuery({
    queryKey: [api.dashboard.get.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.get.path, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401) {
          // Parse + throw for typed handling upstream
          try {
            parseWithLogging(api.dashboard.get.responses[401], JSON.parse(text), "dashboard.401");
          } catch {
            // ignore parse fail; throw generic
          }
        }
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return parseWithLogging(api.dashboard.get.responses[200], await res.json(), "dashboard.get");
    },
  });
}
