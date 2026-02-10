import { useQuery } from "@tanstack/react-query";
import type { CurrentUserResponse } from "@shared/schema";

export function useMe() {
  return useQuery<CurrentUserResponse>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    retry: false,
    staleTime: 1000 * 30,
  });
}
