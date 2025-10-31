import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getSession();
  let userInfo: { role: string; email?: string; name?: string } | null = null;
  
  if (session) {
    try {
      const user = await (prisma as any).user.findUnique({
        where: { id: session.userId },
        include: { employee: { select: { name: true } } },
      });
      if (user) {
        // Auto-link User to Employee if employeeId is missing
        if (!user.employeeId) {
          const employee = await prisma.employee.findUnique({
            where: { contactEmail: user.email },
            select: { id: true },
          });
          if (employee) {
            await (prisma as any).user.update({
              where: { id: user.id },
              data: { employeeId: employee.id },
            });
          }
        }
        userInfo = {
          role: user.role,
          email: user.email,
          name: user.employee?.name ?? null,
        };
      }
    } catch {
      userInfo = { role: session.role };
    }
  }

  const isAdminOrHr = userInfo && (userInfo.role === 'admin' || userInfo.role === 'hr');

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-16 px-8 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50 mb-4">
              Human Resource Information System
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Manage your workforce with employee directory, organizational charts, and comprehensive reporting.
            </p>
          </div>

          {!userInfo ? (
            <div className="flex flex-col gap-4 mt-8">
              <p className="text-zinc-700 dark:text-zinc-300">Please log in to access the system.</p>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-base font-medium text-white transition-colors hover:bg-blue-700"
              >
                Log In
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6 mt-8 w-full max-w-2xl">
              <div className="text-zinc-700 dark:text-zinc-300">
                <p className="text-lg mb-2">
                  Welcome{userInfo.name ? `, ${userInfo.name}` : userInfo.email ? `, ${userInfo.email}` : ''}!
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Role: <span className="font-medium capitalize">{userInfo.role}</span>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/employees"
                  className="flex h-14 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 text-base font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Employee Directory
                </Link>
                <Link
                  href="/org-chart"
                  className="flex h-14 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 text-base font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Org Chart
                </Link>
                {isAdminOrHr && (
                  <Link
                    href="/change-log"
                    className="flex h-14 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 text-base font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 sm:col-span-2"
                  >
                    Change Log
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
