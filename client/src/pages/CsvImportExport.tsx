import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";

export default function CsvImportExportPage() {
  const { toast } = useToast();
  const { data: me, error } = useMe();

  useEffect(() => {
    const msg = (error as Error | undefined)?.message || "";
    if (/^401:/.test(msg)) redirectToLogin(toast);
  }, [error, toast]);

  const isAdmin = me?.role === "admin";
  const canExportStock = me?.role === "admin" || me?.role === "salesman";

  const booksFileRef = useRef<HTMLInputElement>(null);
  const customersFileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState<string | null>(null);

  async function downloadFile(url: string, filename: string) {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: `Downloaded ${filename}` });
    } catch (err: any) {
      toast({ title: err.message || "Download failed", variant: "destructive" });
    }
  }

  async function uploadFile(url: string, file: File, label: string) {
    setImporting(label);
    try {
      const text = await file.text();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        credentials: "include",
        body: text,
      });
      if (!res.ok) {
        const errText = await res.text();
        try {
          const json = JSON.parse(errText);
          throw new Error(json.message || errText);
        } catch {
          throw new Error(errText);
        }
      }
      const result = await res.json();
      toast({ title: `Imported ${result.count || 0} ${label}` });
      queryClient.invalidateQueries({ predicate: () => true });
    } catch (err: any) {
      toast({ title: err.message || "Import failed", variant: "destructive" });
    } finally {
      setImporting(null);
    }
  }

  if (!me) return null;

  const cards = [
    {
      title: "Books",
      show: isAdmin,
      exportUrl: "/api/csv/books",
      exportFilename: "books.csv",
      templateUrl: "/api/csv/template/books",
      templateFilename: "books_template.csv",
      importUrl: "/api/csv/books",
      fileRef: booksFileRef,
      testPrefix: "books",
    },
    {
      title: "Customers",
      show: isAdmin,
      exportUrl: "/api/csv/customers",
      exportFilename: "customers.csv",
      templateUrl: "/api/csv/template/customers",
      templateFilename: "customers_template.csv",
      importUrl: "/api/csv/customers",
      fileRef: customersFileRef,
      testPrefix: "customers",
    },
  ];

  return (
    <AppShell>
      <Seo title="CSV Import/Export | Pyramid Books" />
      <SectionHeader
        title="CSV Import / Export"
        subtitle="Bulk manage your data with CSV files"
        testId="header-csv"
      />

      <div className="row g-4">
        {cards.filter((c) => c.show).map((card) => (
          <div key={card.testPrefix} className="col-12 col-md-6">
            <GlassCard testId={`card-csv-${card.testPrefix}`}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <FileSpreadsheet className="text-primary" style={{ width: 22, height: 22 }} />
                <h5 className="mb-0">{card.title}</h5>
              </div>

              <div className="d-flex flex-column gap-3">
                <div>
                  <div className="fw-semibold small mb-2">Export</div>
                  <button
                    type="button"
                    className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                    onClick={() => downloadFile(card.exportUrl, card.exportFilename)}
                    data-testid={`button-export-${card.testPrefix}`}
                  >
                    <Download style={{ width: 16, height: 16 }} />
                    Download CSV
                  </button>
                </div>

                <hr className="my-1" />

                <div>
                  <div className="fw-semibold small mb-2">Import</div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                      onClick={() => downloadFile(card.templateUrl, card.templateFilename)}
                      data-testid={`button-template-${card.testPrefix}`}
                    >
                      <Download style={{ width: 14, height: 14 }} />
                      Template
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary d-inline-flex align-items-center gap-2"
                      onClick={() => card.fileRef.current?.click()}
                      disabled={importing === card.title}
                      data-testid={`button-import-${card.testPrefix}`}
                    >
                      <Upload style={{ width: 16, height: 16 }} />
                      {importing === card.title ? "Importing..." : "Upload CSV"}
                    </button>
                    <input
                      ref={card.fileRef}
                      type="file"
                      accept=".csv"
                      className="d-none"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(card.importUrl, file, card.title);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        ))}

        {canExportStock && (
          <div className="col-12 col-md-6">
            <GlassCard testId="card-csv-stock">
              <div className="d-flex align-items-center gap-2 mb-4">
                <FileSpreadsheet className="text-primary" style={{ width: 22, height: 22 }} />
                <h5 className="mb-0">Received Stock</h5>
              </div>
              <div>
                <div className="fw-semibold small mb-2">Export</div>
                <button
                  type="button"
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                  onClick={() => downloadFile("/api/csv/stock-receipts", "stock_receipts.csv")}
                  data-testid="button-export-stock"
                >
                  <Download style={{ width: 16, height: 16 }} />
                  Download CSV
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
