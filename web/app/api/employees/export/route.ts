import { NextRequest } from 'next/server';
import type { Employee } from '@/types/employee';
import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function fetchEmployees(): Promise<Employee[]> {
  const rows = await prisma.employee.findMany();
  return rows.map((e) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    department: e.department,
    manager_id: e.managerId ?? null,
    contact_email: e.contactEmail,
    contact_phone: e.contactPhone ?? undefined,
    hire_date: e.hireDate.toISOString().slice(0, 10),
    salary: e.salary,
    status: e.status as any,
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'xlsx').toLowerCase();
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'hr')) {
    return new Response('Forbidden', { status: 403 });
  }
  const allEmployees = (await fetchEmployees()).filter((e) => e.status !== 'terminated');
  const idsParam = searchParams.get('ids');
  const idFilter = idsParam ? new Set(idsParam.split(',').map((s) => s.trim()).filter(Boolean)) : null;
  const employees = idFilter ? allEmployees.filter((e) => idFilter.has(e.id)) : allEmployees;

  // Use complete map so manager names resolve even if manager not in filtered set
  const idToName = new Map(allEmployees.map((e) => [e.id, e.name] as const));
  const headers = ['id','name','title','department','manager_id','manager','contact_email','contact_phone','hire_date','salary','status'];
  const rows = employees.map((e) => [
    e.id,
    e.name,
    e.title,
    e.department,
    e.manager_id ?? '',
    e.manager_id ? (idToName.get(e.manager_id) ?? '') : '',
    e.contact_email,
    e.contact_phone ?? '',
    e.hire_date,
    String(e.salary),
    e.status,
  ]);

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="employees.xlsx"',
      },
    });
  }

  if (format === 'pdf') {
    const pdfDoc = await PDFDocument.create();
    const pageMargin = 36;
    const pageWidth = 612; // Letter width
    const pageHeight = 792; // Letter height
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - pageMargin;

    const fontSizeTitle = 16;
    page.drawText('Employees Export', { x: pageMargin, y: y - fontSizeTitle, size: fontSizeTitle, font: fontBold });
    y -= fontSizeTitle + 12;

    // Compact PDF columns to fit on page
    const colWidths = [150, 110, 110, 120, 70];
    const columns = ['Name', 'Title', 'Department', 'Manager', 'Status'];

    const rowHeight = 16;
    const ellipsis = '…';
    const truncateToWidth = (text: string, width: number, fnt: typeof font, size: number) => {
      const maxWidth = Math.max(0, width);
      if (fnt.widthOfTextAtSize(text, size) <= maxWidth) return text;
      let result = '';
      for (const ch of text) {
        const next = result + ch;
        const w = fnt.widthOfTextAtSize(next + ellipsis, size);
        if (w > maxWidth) break;
        result = next;
      }
      return result ? result + ellipsis : text.slice(0, 1) + ellipsis;
    };

    const drawRow = (vals: string[], bold = false) => {
      let x = pageMargin;
      const usedFont = bold ? fontBold : font;
      vals.forEach((v, i) => {
        const raw = v ?? '';
        const colWidth = colWidths[i] ?? 80;
        const paddedWidth = colWidth - 2; // small padding to avoid bleed
        const text = truncateToWidth(raw, paddedWidth, usedFont, 10);
        page.drawText(text, { x, y: y - 12, size: 10, font: usedFont, color: rgb(0, 0, 0) });
        x += colWidth + 8;
      });
      y -= rowHeight;
    };

    // header row
    drawRow(columns, true);
    y -= 4;

    for (const e of employees) {
      if (y < pageMargin + 40) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - pageMargin;
        drawRow(columns, true);
        y -= 4;
      }
      drawRow([
        e.name,
        e.title,
        e.department,
        e.manager_id ? (idToName.get(e.manager_id) ?? '') : '',
        e.status,
      ]);
    }

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="employees.pdf"',
      },
    });
  }

  return new Response('Unsupported format', { status: 400 });
}


