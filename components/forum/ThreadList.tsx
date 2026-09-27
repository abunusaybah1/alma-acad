import Link from "next/link";

type ThreadListItem = {
  id: string;
  title: string;
  created_at: string;
  locked: boolean;
  authorName: string;
  replyCount: number;
};

export function ThreadList({
  threads,
  basePath,
  emptyMessage,
}: {
  threads: ThreadListItem[];
  basePath: string;
  emptyMessage: string;
}) {
  if (threads.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-10 text-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((t) => (
        <Link
          key={t.id}
          href={`${basePath}/${t.id}`}
          className="flex items-center justify-between px-5 py-4 rounded-lg border border-border hover:border-accent transition-colors"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{t.title}</p>
              {t.locked && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                  locked
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {t.authorName} · {new Date(t.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
            {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
          </span>
        </Link>
      ))}
    </div>
  );
}
