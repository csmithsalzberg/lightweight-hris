import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  try {
    let user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { employee: { select: { name: true } } },
    });
    if (!user) return NextResponse.json({ user: null });
    
    // Auto-link User to Employee if employeeId is missing but an Employee exists with matching email
    if (!user.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { contactEmail: user.email },
        select: { id: true },
      });
      if (employee) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { employeeId: employee.id },
          include: { employee: { select: { name: true } } },
        });
      }
    }
    
    const name = user.employee?.name ?? null;
    return NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        employeeId: user.employeeId ?? null,
        email: user.email,
        name,
      },
    });
  } catch {
    return NextResponse.json({ user: { id: session.userId, role: session.role, employeeId: session.employeeId ?? null } });
  }
}


