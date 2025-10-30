import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/passwords';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    const setCookie = createSessionCookie({ userId: user.id, role: user.role as any, employeeId: user.employeeId });
    return new NextResponse(JSON.stringify({ id: user.id, role: user.role, employeeId: user.employeeId }), {
      headers: { 'Set-Cookie': setCookie, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Login failed' }, { status: 500 });
  }
}


