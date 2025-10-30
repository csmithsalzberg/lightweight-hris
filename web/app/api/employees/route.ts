import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ employees });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await prisma.employee.create({
      data: {
        name: body.name,
        title: body.title,
        department: body.department,
        managerId: body.managerId ?? null,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone ?? null,
        hireDate: new Date(body.hireDate),
        salary: Number(body.salary),
        status: body.status,
      },
    });
    // audit log
    await prisma.changeLog.create({
      data: {
        entityType: 'Employee',
        entityId: created.id,
        action: 'create',
        changes: { after: created },
        actorId: null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to create', code: e?.code ?? null, meta: e?.meta ?? null }, { status: 400 });
  }
}
