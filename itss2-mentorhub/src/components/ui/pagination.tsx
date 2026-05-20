import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  prevLabel?: string;
  nextLabel?: string;
};

export function Pagination({ page, totalPages, buildHref, prevLabel = 'Trước', nextLabel = 'Sau' }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-2 pt-2 text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1 hover:bg-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {prevLabel}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-1 text-muted-foreground/60">
          <ChevronLeft className="h-3.5 w-3.5" />
          {prevLabel}
        </span>
      )}
      <span className="text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1 hover:bg-accent"
        >
          {nextLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-1 text-muted-foreground/60">
          {nextLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </nav>
  );
}
