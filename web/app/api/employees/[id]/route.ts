import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type Params = { params: { id?: string } };

export async function GET(_req: Request, ctx: { params: Promise<{ id?: string }> } | Params) {
  try {
    const p = 'then' in (ctx as any).params ? await (ctx as any).params : (ctx as any).params;
    const id = p.id as string | undefined;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id?: string }> } | Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const p = 'then' in (ctx as any).params ? await (ctx as any).params : (ctx as any).params;
    const id = p.id as string | undefined;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    if (session.role === 'employee') {
      const currentManagerId = session.employeeId ?? '__none__';
      const target = await prisma.employee.findUnique({ select: { managerId: true }, where: { id } });
      if (!target || target.managerId !== currentManagerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const body = await req.json();
    const before = await prisma.employee.findUnique({ where: { id } });
    // Basic validation for managerId: disallow self and require existing manager when provided
    if (body.managerId) {
      if (body.managerId === id) {
        return NextResponse.json({ error: 'An employee cannot manage themselves' }, { status: 400 });
      }
      const mgr = await prisma.employee.findUnique({ where: { id: body.managerId } });
      if (!mgr) {
        return NextResponse.json({ error: 'managerId does not reference an existing employee' }, { status: 400 });
      }

      // Cycle detection: walk up the manager chain from the proposed manager.
      // If we encounter this employee's id, it would create a cycle.
      let cursor: string | null = body.managerId as string;
      const visited = new Set<string>();
      for (let i = 0; i < 100 && cursor; i++) {
        if (visited.has(cursor)) break; // safety against unexpected loops
        visited.add(cursor);
        if (cursor === id) {
          return NextResponse.json({ error: 'Choosing this manager creates a circular reporting chain' }, { status: 400 });
        }
        const mgrRow: { managerId: string | null } | null = await prisma.employee.findUnique({ select: { managerId: true }, where: { id: cursor } });
        cursor = (mgrRow?.managerId as string | null) ?? null;
      }
    }
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        department: body.department,
        managerId: body.managerId ?? null,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone ?? null,
        hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
        salary: body.salary !== undefined ? Number(body.salary) : undefined,
        status: body.status,
      },
    });
    // audit log
    await prisma.changeLog.create({
      data: {
        entityType: 'Employee',
        entityId: id,
        action: 'update',
        changes: { before, after: updated },
        actorId: null,
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to update', code: e?.code ?? null, meta: e?.meta ?? null }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request, 
  { params }: { params: Promise<{ id?: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'hr')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const before = await prisma.employee.findUnique({ where: { id } });
    if (!before) {
      // Idempotent delete: if it's already gone, respond OK
      return NextResponse.json({ ok: true });
    }
    // With onDelete rules (SetNull for manager reports and Cascade for change logs),
    // a simple delete is sufficient.
    try {
      await prisma.employee.delete({ where: { id: id } });
    } catch (e: any) {
      // If the record was deleted concurrently, treat as success
      if (e?.code === 'P2025') {
        return NextResponse.json({ ok: true });
      }
      throw e;
    }
    // audit log
    await prisma.changeLog.create({
      data: {
        entityType: 'Employee',
        entityId: id,
        action: 'delete',
        changes: { before },
        actorId: null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.code === 'P2025' ? 404 : 400;
    return NextResponse.json(
      { error: e?.message ?? 'Failed to delete', code: e?.code ?? null, meta: e?.meta ?? null },
      { status }
    );
  }
}


