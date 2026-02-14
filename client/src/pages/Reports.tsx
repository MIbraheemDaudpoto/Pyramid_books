import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useReports } from "@/hooks/use-reports";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { BarChart3, TrendingUp, Users, BookOpen, DollarSign, Download, Calendar, Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency, cn } from "@/lib/utils";

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

  const isAdmin = me.role === "admin";

  function exportSalesByMonth() {
    if (!data) return;
    downloadCsv("sales_by_month.csv",
      ["Month", "Orders", "Revenue"],
      data.salesByMonth.map((r) => [r.month, String(r.count), String(r.total)])
    );
    toast({ title: "Exported successful", description: "Sales by month data downloaded." });
  }

  function exportTopBooks() {
    if (!data) return;
    downloadCsv("top_books.csv",
      ["Book", "Total Qty Sold", "Revenue"],
      data.topBooks.map((r) => [r.title, String(r.totalQty), String(r.totalRevenue)])
    );
    toast({ title: "Exported successful", description: "Top books data downloaded." });
  }

  function exportOutstanding() {
    if (!data) return;
    downloadCsv("outstanding_balances.csv",
      ["Customer", "Total Orders", "Total Paid", "Balance"],
      data.outstandingBalances.map((r) => [r.name, String(r.totalOrders), String(r.totalPaid), String(r.balance)])
    );
    toast({ title: "Exported successful", description: "Outstanding balances data downloaded." });
  }

  return (
    <AppShell>
      <Seo title="Analytics & Reports — Pyramid Books" description="Comprehensive business performance insights and data exports." />

      <SectionHeader
        title="Business Analytics"
        subtitle="Deep dive into your sales performance, inventory turnover, and customer activity."
        testId="header-reports"
      />

      <GlassCard className="border-0 shadow-sm p-4 mb-5">
        <div className="d-flex align-items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <h6 className="fw-black text-dark text-uppercase mb-0" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Report Parameters</h6>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="bg-light rounded-4 px-3 py-2 border">
              <label className="form-label small text-muted mb-0">Starting Period</label>
              <input
                type="date"
                className="form-control border-0 bg-transparent p-0 shadow-none fw-bold"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="input-from-date"
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="bg-light rounded-4 px-3 py-2 border">
              <label className="form-label small text-muted mb-0">Ending Period</label>
              <input
                type="date"
                className="form-control border-0 bg-transparent p-0 shadow-none fw-bold"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="input-to-date"
              />
            </div>
          </div>
          <div className="col-12 col-md-4 d-flex align-items-end">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-4 px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2"
              onClick={() => { setFromDate(""); setToDate(""); }}
              disabled={!fromDate && !toDate}
              data-testid="button-clear-dates"
            >
              <X className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="vstack gap-4">
          <div className="row g-4">
            <div className="col-lg-6"><div className="placeholder-glow"><div className="placeholder col-12 rounded-4" style={{ height: '400px' }} /></div></div>
            <div className="col-lg-6"><div className="placeholder-glow"><div className="placeholder col-12 rounded-4" style={{ height: '400px' }} /></div></div>
          </div>
        </div>
      ) : data ? (
        <div className="row g-4">
          {/* Sales Performance */}
          <div className="col-12 col-lg-6">
            <GlassCard testId="card-sales-by-month" className="border-0 shadow-sm p-0 overflow-hidden h-100">
              <div className="p-4 d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h5 className="fw-black text-dark mb-0">Revenue Trend</h5>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary rounded-pill px-3"
                  onClick={exportSalesByMonth}
                  data-testid="button-export-sales-month"
                >
                  <Download className="w-3.5 h-3.5 me-1" />
                  Export CSV
                </button>
              </div>
              <div className="p-4">
                {data.salesByMonth.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    <Calendar className="w-12 h-12 opacity-10 mx-auto mb-2" />
                    <p>No sales activity found for this period.</p>
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={data.salesByMonth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="total" name="Revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40}>
                          {data.salesByMonth.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === data.salesByMonth.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Products */}
          <div className="col-12 col-lg-6">
            <GlassCard testId="card-top-books" className="border-0 shadow-sm p-0 overflow-hidden h-100">
              <div className="p-4 d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-accent-subtle rounded-3 text-accent">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h5 className="fw-black text-dark mb-0">Best Sellers</h5>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary rounded-pill px-3"
                  onClick={exportTopBooks}
                  data-testid="button-export-top-books"
                >
                  <Download className="w-3.5 h-3.5 me-1" />
                  Export CSV
                </button>
              </div>
              <div className="p-4">
                {data.topBooks.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    <p>Insufficient data to calculate best sellers.</p>
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart layout="vertical" data={data.topBooks} margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="title"
                          type="category"
                          width={120}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#666', fontWeight: 600 }}
                          tickFormatter={(val) => val.length > 18 ? val.slice(0, 16) + '…' : val}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="totalRevenue" name="Revenue" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Customers */}
          <div className="col-12 col-lg-6">
            <GlassCard testId="card-top-customers" className="border-0 shadow-sm p-0 overflow-hidden h-100">
              <div className="p-4 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-success-subtle rounded-3 text-success">
                    <Users className="w-5 h-5" />
                  </div>
                  <h5 className="fw-black text-dark mb-0">Valuable Customers</h5>
                </div>
              </div>
              <div className="p-4">
                {data.topCustomers.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    <p>No customer activity recorded for this period.</p>
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart layout="vertical" data={data.topCustomers} margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666', fontWeight: 600 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="totalSpent" name="Total Contribution" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Accounts Receivable */}
          <div className="col-12 col-lg-6">
            <GlassCard testId="card-outstanding-balances" className="border-0 shadow-sm p-0 overflow-hidden h-100">
              <div className="p-4 d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-destructive-subtle rounded-3 text-destructive">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h5 className="fw-black text-dark mb-0">Accounts Receivable</h5>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary rounded-pill px-3"
                  onClick={exportOutstanding}
                  data-testid="button-export-outstanding"
                >
                  <Download className="w-3.5 h-3.5 me-1" />
                  Export CSV
                </button>
              </div>
              <div className="p-0">
                {data.outstandingBalances.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    <p className="mb-0">No outstanding balances recorded.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr className="text-muted small border-0">
                          <th className="px-4 py-3 border-0 text-uppercase fw-bold">Customer</th>
                          <th className="py-3 border-0 text-uppercase fw-bold text-end">Orders</th>
                          <th className="py-3 border-0 text-uppercase fw-bold text-end">Settled</th>
                          <th className="px-4 py-3 border-0 text-uppercase fw-bold text-end">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="border-0">
                        {data.outstandingBalances.map((r, i) => (
                          <tr key={i} className="border-0">
                            <td className="px-4 py-3 border-bottom-0 fw-bold text-dark">{r.name}</td>
                            <td className="py-3 border-bottom-0 text-end text-muted">{formatCurrency(r.totalOrders)}</td>
                            <td className="py-3 border-bottom-0 text-end text-success fw-medium">{formatCurrency(r.totalPaid)}</td>
                            <td className={cn(
                              "px-4 py-3 border-bottom-0 text-end fw-black",
                              Number(r.balance) > 0 ? "text-danger" : "text-success"
                            )}>
                              {formatCurrency(r.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Sales Performance Grid */}
          {isAdmin && data.salesmanPerformance.length > 0 && (
            <div className="col-12">
              <GlassCard testId="card-salesman-performance" className="border-0 shadow-sm p-0 overflow-hidden">
                <div className="p-4 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h5 className="fw-black text-dark mb-0">Sales Team Performance</h5>
                  </div>
                </div>
                <div className="p-4">
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={data.salesmanPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="totalSales" name="Total Sales Volume" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
