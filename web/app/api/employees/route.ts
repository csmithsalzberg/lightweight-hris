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

import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/passwords';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'hr')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
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
    // Create or update login for employee (password = their email) if not exists
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
      if (err?.code === 'P2002') {
        // User already exists - update employeeId if not set
        await prisma.user.update({
          where: { email: created.contactEmail },
          data: { employeeId: created.id },
        });
      } else {
        throw err;
      }
    }
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
