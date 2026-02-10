import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useReports } from "@/hooks/use-reports";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { BarChart3, TrendingUp, Users, BookOpen, DollarSign, Download } from "lucide-react";
import { useEffect, useState } from "react";

function money(n: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: me } = useMe();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data, isLoading, error } = useReports(fromDate || undefined, toDate || undefined);

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  if (!me) return null;

  const isAdmin = me.role === "super_admin";

  function exportSalesByMonth() {
    if (!data) return;
    downloadCsv("sales_by_month.csv",
      ["Month", "Orders", "Revenue"],
      data.salesByMonth.map((r) => [r.month, String(r.count), String(r.total)])
    );
    toast({ title: "Exported sales by month" });
  }

  function exportTopBooks() {
    if (!data) return;
    downloadCsv("top_books.csv",
      ["Book", "Total Qty Sold", "Revenue"],
      data.topBooks.map((r) => [r.title, String(r.totalQty), String(r.totalRevenue)])
    );
    toast({ title: "Exported top books" });
  }

  function exportOutstanding() {
    if (!data) return;
    downloadCsv("outstanding_balances.csv",
      ["Customer", "Total Orders", "Total Paid", "Balance"],
      data.outstandingBalances.map((r) => [r.name, String(r.totalOrders), String(r.totalPaid), String(r.balance)])
    );
    toast({ title: "Exported outstanding balances" });
  }

  return (
    <AppShell>
      <Seo title="Reports | Pyramid Books" />
      <SectionHeader
        title="Reports"
        subtitle="Analytics and performance insights"
        testId="header-reports"
      />

      <GlassCard className="mb-4" testId="report-filters">
        <div className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <label className="form-label small fw-semibold mb-1">From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              data-testid="input-from-date"
            />
          </div>
          <div>
            <label className="form-label small fw-semibold mb-1">To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              data-testid="input-to-date"
            />
          </div>
          <button
            type="button"
            className="btn btn-outline-primary d-inline-flex align-items-center gap-1"
            onClick={() => { setFromDate(""); setToDate(""); }}
            data-testid="button-clear-dates"
          >
            Clear
          </button>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : data ? (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <GlassCard testId="card-sales-by-month">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <BarChart3 className="text-primary" style={{ width: 20, height: 20 }} />
                  <h5 className="mb-0">Sales by Month</h5>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={exportSalesByMonth}
                  data-testid="button-export-sales-month"
                >
                  <Download style={{ width: 14, height: 14 }} />
                  CSV
                </button>
              </div>
              {data.salesByMonth.length === 0 ? (
                <div className="text-muted text-center py-3">No sales data</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th className="text-end">Orders</th>
                        <th className="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salesByMonth.map((r, i) => (
                        <tr key={i}>
                          <td>{r.month}</td>
                          <td className="text-end">{r.count}</td>
                          <td className="text-end fw-semibold">{money(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>

          <div className="col-12 col-lg-6">
            <GlassCard testId="card-top-books">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <BookOpen className="text-primary" style={{ width: 20, height: 20 }} />
                  <h5 className="mb-0">Top Books</h5>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={exportTopBooks}
                  data-testid="button-export-top-books"
                >
                  <Download style={{ width: 14, height: 14 }} />
                  CSV
                </button>
              </div>
              {data.topBooks.length === 0 ? (
                <div className="text-muted text-center py-3">No data</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th className="text-end">Qty Sold</th>
                        <th className="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topBooks.map((r, i) => (
                        <tr key={i}>
                          <td>{r.title}</td>
                          <td className="text-end">{r.totalQty}</td>
                          <td className="text-end fw-semibold">{money(r.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>

          <div className="col-12 col-lg-6">
            <GlassCard testId="card-top-customers">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Users className="text-primary" style={{ width: 20, height: 20 }} />
                <h5 className="mb-0">Top Customers</h5>
              </div>
              {data.topCustomers.length === 0 ? (
                <div className="text-muted text-center py-3">No data</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th className="text-end">Orders</th>
                        <th className="text-end">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCustomers.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td className="text-end">{r.orderCount}</td>
                          <td className="text-end fw-semibold">{money(r.totalSpent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>

          <div className="col-12 col-lg-6">
            <GlassCard testId="card-outstanding-balances">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <DollarSign className="text-primary" style={{ width: 20, height: 20 }} />
                  <h5 className="mb-0">Outstanding Balances</h5>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={exportOutstanding}
                  data-testid="button-export-outstanding"
                >
                  <Download style={{ width: 14, height: 14 }} />
                  CSV
                </button>
              </div>
              {data.outstandingBalances.length === 0 ? (
                <div className="text-muted text-center py-3">No data</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th className="text-end">Orders</th>
                        <th className="text-end">Paid</th>
                        <th className="text-end">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.outstandingBalances.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td className="text-end">{money(r.totalOrders)}</td>
                          <td className="text-end">{money(r.totalPaid)}</td>
                          <td className={`text-end fw-semibold ${Number(r.balance) > 0 ? "text-danger" : "text-success"}`}>
                            {money(r.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>

          {isAdmin && data.salesmanPerformance.length > 0 && (
            <div className="col-12">
              <GlassCard testId="card-salesman-performance">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <TrendingUp className="text-primary" style={{ width: 20, height: 20 }} />
                  <h5 className="mb-0">Salesman Performance</h5>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Salesman</th>
                        <th className="text-end">Orders</th>
                        <th className="text-end">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salesmanPerformance.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td className="text-end">{r.orderCount}</td>
                          <td className="text-end fw-semibold">{money(r.totalSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
