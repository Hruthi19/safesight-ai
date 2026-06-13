function escapeCsv(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportIncidentsCsv(incidents) {
  const headers = [
    "id",
    "incident_type",
    "severity",
    "status",
    "location",
    "confidence",
    "created_at",
  ];

  const rows = incidents.map((inc) =>
    headers.map((h) => escapeCsv(inc[h])).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `safesight-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportIncidentsPdf(incidents) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text("SafeSight AI — Incident Report", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Total incidents: ${incidents.length}`, 14, 34);

  let y = 44;
  doc.setTextColor(0);
  doc.setFontSize(9);

  for (const inc of incidents.slice(0, 40)) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const line = `#${inc.id}  ${(inc.incident_type || "").replace(/_/g, " ")}  |  ${inc.severity}  |  ${inc.status}  |  ${inc.location || "—"}`;
    doc.text(line, 14, y);
    y += 6;
  }

  if (incidents.length > 40) {
    doc.text(`... and ${incidents.length - 40} more (see CSV export)`, 14, y + 4);
  }

  doc.save(`safesight-incidents-${new Date().toISOString().slice(0, 10)}.pdf`);
}
