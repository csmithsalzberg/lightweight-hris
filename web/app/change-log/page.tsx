import { prisma } from '@/lib/prisma';

export default async function ChangeLogPage() {
  const logs = await prisma.changeLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Change Log</h1>
        <p className="text-sm text-gray-600">Recent changes with before/after details.</p>
      </header>

      {logs.length === 0 ? (
        <p className="text-gray-600">No changes recorded.</p>
      ) : (
        <ol className="list-decimal pl-6 space-y-4">
          {logs.map((log) => {
            let before: unknown = undefined;
            let after: unknown = undefined;
            let payload: unknown = undefined;
            const changes = log.changes as any;
            if (changes && typeof changes === 'object') {
              if ('before' in changes || 'after' in changes) {
                before = (changes as any).before;
                after = (changes as any).after;
              } else {
                payload = changes;
              }
            } else {
              payload = changes;
            }

            return (
              <li key={log.id} className="space-y-2">
                <div className="text-sm text-gray-800">
                  <span className="font-medium">{log.action}</span> {log.entityType}
                  {log.entityId ? ` (${log.entityId})` : ''} by {log.actorId || 'system'}
                  <span className="text-gray-500"> — {new Date(log.createdAt).toLocaleString()}</span>
                </div>
                {before !== undefined || after !== undefined ? (
                  <div className="grid gap-2">
                    <div>
                      <div className="text-xs uppercase text-gray-500">Before</div>
                      <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-2 text-xs">{JSON.stringify(before, null, 2)}</pre>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-gray-500">After</div>
                      <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-2 text-xs">{JSON.stringify(after, null, 2)}</pre>
                    </div>
                  </div>
                ) : payload !== undefined ? (
                  <div>
                    <div className="text-xs uppercase text-gray-500">Details</div>
                    <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-2 text-xs">{JSON.stringify(payload, null, 2)}</pre>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}


