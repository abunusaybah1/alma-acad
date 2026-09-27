import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <Link
        href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}
        aria-disabled={currentPage <= 1}
        className={`text-sm ${
          currentPage <= 1
            ? "text-gray-300 pointer-events-none"
            : "text-accent hover:underline"
        }`}
      >
        ← Previous
      </Link>
      <span className="text-xs font-mono text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <Link
        href={`${basePath}?page=${Math.min(totalPages, currentPage + 1)}`}
        aria-disabled={currentPage >= totalPages}
        className={`text-sm ${
          currentPage >= totalPages
            ? "text-gray-300 pointer-events-none"
            : "text-accent hover:underline"
        }`}
      >
        Next →
      </Link>
    </div>
  );
}
