import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: params.id } });
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const updated = await prisma.employee.update({
      where: { id: params.id },
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
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to update' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.employee.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to delete' }, { status: 400 });
  }
}


