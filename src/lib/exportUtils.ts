import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportRowsToExcel(rows: Record<string, unknown>[], filename: string, sheetName = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  const worksheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
}

export function exportRowsToPdf(
  title: string,
  subtitle: string,
  rows: Record<string, unknown>[],
  filename: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.setTextColor(20, 83, 45);
  doc.text('PEMERINTAH DESA PINANGSARI', 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Dusun Wanasari RT.003/RW.003, Kec. Ciasem, Kab. Subang, Jawa Barat', 14, 21);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, 30);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 35);

  if (rows.length === 0) {
    doc.text('Data belum tersedia.', 14, 46);
  } else {
    const columns = Object.keys(rows[0]).map((k) => ({
      header: k.replace(/_/g, ' ').toUpperCase(),
      dataKey: k,
    }));
    autoTable(doc, {
      startY: 40,
      columns,
      body: rows.map((r) => {
        const obj: Record<string, string> = {};
        for (const k of Object.keys(r)) {
          obj[k] = String(r[k] ?? '');
        }
        return obj;
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  doc.save(`${filename}.pdf`);
}
