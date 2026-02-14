import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OrderWithItemsResponse } from "@shared/schema";
import logoUrl from "@assets/pyramid-books-logo-official.jpg";

const COMPANY = {
  name: "Pyramid Books",
  tagline: "Promoter & Distributor",
  address: "Latifabad, Hyderabad",
  phone: "",
  email: "",
};

function money(n: any): string {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load logo"));
    img.src = url;
  });
}

export async function generateInvoicePDF(order: OrderWithItemsResponse) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  doc.setFillColor(26, 45, 80);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setFillColor(0, 163, 184);
  doc.triangle(pageWidth - 60, 0, pageWidth, 0, pageWidth, 42, "F");

  try {
    const logoData = await loadImageAsBase64(logoUrl);
    doc.addImage(logoData, "JPEG", margin, y + 2, 36, 12);
  } catch (_) { }

  const textOffset = margin + 40;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, textOffset, y + 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.tagline, textOffset, y + 19);
  doc.text(COMPANY.address, textOffset, y + 25);

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, y + 14, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`#${order.orderNo}`, pageWidth - margin, y + 22, { align: "right" });

  y = 50;

  doc.setDrawColor(0, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", margin, y);
  doc.text("INVOICE DETAILS", pageWidth / 2 + 10, y);

  y += 6;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(order.customer.name, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (order.customer.email) {
    y += 5;
    doc.text(order.customer.email, margin, y);
  }
  if (order.customer.phone) {
    y += 5;
    doc.text(order.customer.phone, margin, y);
  }
  if (order.customer.address) {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Delivery Address:", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const addressLines = doc.splitTextToSize(order.customer.address, 80);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4;
  }

  let detailY = 64;
  const detailX = pageWidth / 2 + 10;
  doc.setFontSize(9);

  const details = [
    ["Invoice No:", `#${order.orderNo}`],
    ["Date:", order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"],
    ["Status:", (order.status || "pending").toUpperCase()],
  ];

  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, detailX, detailY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(value, detailX + 28, detailY);
    detailY += 5.5;
  });

  y = Math.max(y, detailY) + 8;

  const discountPct = Number(order.discountPercentage || 0);

  const tableHead = [["#", "Book Title", "Author", "Qty", "Unit Price", "Discount", "Line Total"]];
  const tableBody = order.items.map((item, idx) => {
    const unitPrice = Number(item.unitPrice);
    const lineTotal = Number(item.lineTotal);
    const discountAmount = discountPct > 0 ? (unitPrice * item.qty * discountPct) / 100 : 0;

    return [
      String(idx + 1),
      item.book.title,
      item.book.author || "-",
      String(item.qty),
      money(unitPrice),
      discountPct > 0 ? `${discountPct}% (-${money(discountAmount)})` : "-",
      money(lineTotal),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [26, 45, 80],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30 },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "right", cellWidth: 24 },
      5: { halign: "right", cellWidth: 32 },
      6: { halign: "right", cellWidth: 24 },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: () => { },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 40;
  y = finalY + 8;

  const summaryX = pageWidth - margin - 70;
  const valX = pageWidth - margin;

  const drawSummaryRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(bold ? 26 : 80, bold ? 45 : 80, bold ? 80 : 80);
    doc.text(label, summaryX, y);
    doc.text(value, valX, y, { align: "right" });
    y += 6;
  };

  drawSummaryRow("Subtotal:", money(order.subtotal));
  if (discountPct > 0) {
    drawSummaryRow(`Discount (${discountPct}%):`, `-${money(order.discount)}`);
  }
  if (Number(order.tax) > 0) {
    drawSummaryRow("Tax:", money(order.tax));
  }

  doc.setDrawColor(26, 45, 80);
  doc.setLineWidth(0.3);
  doc.line(summaryX, y - 2, valX, y - 2);
  y += 2;

  doc.setFillColor(26, 45, 80);
  doc.roundedRect(summaryX - 3, y - 5, valX - summaryX + 6, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", summaryX, y + 1);
  doc.text(money(order.total), valX, y + 1, { align: "right" });
  y += 16;

  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    "Discount is given by only Company, so this is not the final bill. Final pricing will be confirmed after order review.",
    margin,
    y,
    { maxWidth: pageWidth - 2 * margin }
  );

  y += 12;

  if (order.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("ORDER NOTES:", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(order.notes, margin, y, { maxWidth: pageWidth - 2 * margin });
    y += 8;
  }

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(0, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`${COMPANY.name} | ${COMPANY.address}`, margin, footerY);
  doc.text("Thank you for your business!", pageWidth - margin, footerY, { align: "right" });

  doc.save(`Pyramid-Books-Invoice-${order.orderNo}.pdf`);
}
