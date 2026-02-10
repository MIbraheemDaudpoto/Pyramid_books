import { useQuery } from "@tanstack/react-query";
import type { ReportResponse } from "@shared/schema";

export function useReports(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const url = qs ? `/api/reports?${qs}` : "/api/reports";

  return useQuery<ReportResponse>({
    queryKey: ["/api/reports", from || "", to || ""],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });
}
