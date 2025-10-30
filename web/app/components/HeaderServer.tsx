import Header from './Header';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function HeaderServer() {
  const session = await getSession();
  if (!session) return <Header initialUser={null} />;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { employee: { select: { name: true } } },
    });
    if (!user) return <Header initialUser={null} />;
    const initialUser = {
      id: user.id,
      role: user.role as any,
      employeeId: user.employeeId ?? null,
      email: user.email,
      name: user.employee?.name ?? null,
    };
    return <Header initialUser={initialUser} />;
  } catch {
    return <Header initialUser={{ id: session.userId, role: session.role as any, employeeId: session.employeeId ?? null }} />;
  }
}


