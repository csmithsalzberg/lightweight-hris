import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { employee: { select: { name: true } } },
    });
    if (!user) return NextResponse.json({ user: null });
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


