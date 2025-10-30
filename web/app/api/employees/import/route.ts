import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/passwords';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'hr')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return NextResponse.json({ error: 'No sheets found' }, { status: 400 });
    const ws = wb.Sheets[sheetName];

    // Read as array of arrays to preserve headers and types
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    if (!rows.length) return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    const headers = (rows[0] ?? []).map((h: any) => String(h || '').trim().toLowerCase());

    // Supported headers (case-insensitive), align with export
    // id is ignored on import
    const idx = (name: string) => headers.indexOf(name);
    const nameIdx = idx('name');
    const titleIdx = idx('title');
    const deptIdx = idx('department');
    const mgrIdx = idx('manager_id');
    const emailIdx = idx('contact_email');
    const phoneIdx = idx('contact_phone');
    const hireIdx = idx('hire_date');
    const salaryIdx = idx('salary');
    const statusIdx = idx('status');

    if (nameIdx < 0 || titleIdx < 0 || deptIdx < 0 || emailIdx < 0 || hireIdx < 0 || salaryIdx < 0 || statusIdx < 0) {
      return NextResponse.json({ error: 'Missing required headers. Required: name,title,department,contact_email,hire_date,salary,status' }, { status: 400 });
    }

    const data = [] as Array<{
      name: string;
      title: string;
      department: string;
      managerId?: string | null;
      contactEmail: string;
      contactPhone?: string | null;
      hireDate: Date;
      salary: number;
      status: 'active' | 'leave' | 'terminated';
      __rowNumber: number;
    }>;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const name = String(row[nameIdx] ?? '').trim();
      const title = String(row[titleIdx] ?? '').trim();
      const department = String(row[deptIdx] ?? '').trim();
      const managerIdRaw = mgrIdx >= 0 ? String(row[mgrIdx] ?? '').trim() : '';
      const contactEmail = String(row[emailIdx] ?? '').trim();
      const contactPhoneRaw = phoneIdx >= 0 ? String(row[phoneIdx] ?? '').trim() : '';
      const hireDateStr = String(row[hireIdx] ?? '').trim();
      const salaryStr = String(row[salaryIdx] ?? '').trim();
      const statusStr = String(row[statusIdx] ?? '').trim().toLowerCase();

      if (!name || !title || !department || !contactEmail || !hireDateStr || !salaryStr || !statusStr) continue;

      const hireDate = new Date(hireDateStr);
      if (isNaN(hireDate.getTime())) continue;
      const salary = Number(salaryStr);
      if (!Number.isFinite(salary)) continue;
      if (!['active', 'leave', 'terminated'].includes(statusStr)) continue;

      data.push({
        name,
        title,
        department,
        managerId: managerIdRaw || null,
        contactEmail,
        contactPhone: contactPhoneRaw || null,
        hireDate,
        salary: Math.round(salary),
        status: statusStr as any,
        __rowNumber: r + 1,
      });
    }

    if (!data.length) return NextResponse.json({ error: 'No valid rows found' }, { status: 400 });

    // Pre-validate managerId FKs
    const managerIds = Array.from(new Set(data.map(d => d.managerId).filter((v): v is string => Boolean(v))));
    const existingManagers = managerIds.length
      ? await prisma.employee.findMany({ select: { id: true }, where: { id: { in: managerIds } } })
      : [];
    const existingManagerIdSet = new Set(existingManagers.map(m => m.id));

    const errors: Array<{ row: number; message: string }> = [];
    let inserted = 0;

    for (const row of data) {
      if (row.managerId && !existingManagerIdSet.has(row.managerId)) {
        errors.push({ row: row.__rowNumber, message: `manager_id '${row.managerId}' does not reference an existing employee` });
        continue;
      }
      try {
        const created = await prisma.employee.create({
          data: {
            name: row.name,
            title: row.title,
            department: row.department,
            managerId: row.managerId ?? null,
            contactEmail: row.contactEmail,
            contactPhone: row.contactPhone ?? null,
            hireDate: row.hireDate,
            salary: row.salary,
            status: row.status,
          },
        });
        // Create login for employee (password = their email) if not exists
        try {
          const pwd = await hashPassword(created.contactEmail);
          await prisma.user.create({
            data: {
              email: created.contactEmail,
              passwordHash: pwd,
              role: 'employee',
              employeeId: created.id,
            },
          });
        } catch (err: any) {
          if (err?.code !== 'P2002') throw err;
        }
        await prisma.changeLog.create({
          data: {
            entityType: 'Employee',
            entityId: created.id,
            action: 'create',
            changes: { after: created },
            actorId: 'import',
          },
        });
        inserted += 1;
      } catch (e: any) {
        const code = e?.code as string | undefined;
        if (code === 'P2002') {
          errors.push({ row: row.__rowNumber, message: `Duplicate unique field (likely contact_email '${row.contactEmail}')` });
        } else if (code === 'P2003') {
          errors.push({ row: row.__rowNumber, message: 'Foreign key constraint failed (check manager_id)' });
        } else {
          errors.push({ row: row.__rowNumber, message: e?.message ?? 'Unknown error' });
        }
      }
    }

    return NextResponse.json({ inserted, failed: errors.length, total: data.length, errors: errors.slice(0, 50) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Import failed' }, { status: 400 });
  }
}


