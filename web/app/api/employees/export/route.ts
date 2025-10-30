import { NextRequest } from 'next/server';
import type { Employee } from '@/types/employee';
import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('http://localhost:3000/api/employees', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch employees');
  const data = await res.json();
  const emps: Employee[] = (data.employees ?? []).map((e: any) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    department: e.department,
    manager_id: e.managerId ?? null,
    contact_email: e.contactEmail,
    contact_phone: e.contactPhone ?? undefined,
    hire_date: typeof e.hireDate === 'string' ? e.hireDate.slice(0, 10) : e.hireDate,
    salary: e.salary,
    status: e.status,
  }));
  return emps;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'xlsx').toLowerCase();
  const employees = (await fetchEmployees()).filter((e) => e.status !== 'terminated');

  const headers = ['id','name','title','department','manager_id','contact_email','contact_phone','hire_date','salary','status'];
  const rows = employees.map((e) => [
    e.id,
    e.name,
    e.title,
    e.department,
    e.manager_id ?? '',
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

    const colWidths = [80, 130, 110, 100, 90];
    const columns = ['Name', 'Email', 'Title', 'Department', 'Status'];

    const rowHeight = 16;
    const drawRow = (vals: string[], bold = false) => {
      let x = pageMargin;
      const usedFont = bold ? fontBold : font;
      vals.forEach((v, i) => {
        const text = v ?? '';
        page.drawText(text, { x, y: y - 12, size: 10, font: usedFont, color: rgb(0, 0, 0) });
        x += colWidths[i] + 8;
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
        e.contact_email,
        e.title,
        e.department,
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


