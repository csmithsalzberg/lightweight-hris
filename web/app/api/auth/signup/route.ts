import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwords';

export async function POST(req: Request) {
  try {
    const { email, password, role, employeeId } = await req.json();
    if (!email || !password || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (!['admin', 'hr', 'employee'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    const hash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash: hash, role, employeeId: employeeId ?? null } });
    return NextResponse.json({ id: user.id, role: user.role, employeeId: user.employeeId });
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    return NextResponse.json({ error: e?.message ?? 'Signup failed' }, { status: 500 });
  }
}


