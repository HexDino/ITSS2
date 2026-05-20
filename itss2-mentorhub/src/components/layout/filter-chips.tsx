import Link from 'next/link';
import { cn } from '@/lib/utils';

type Chip = { value: string; label: string };

type Props = {
  chips: Chip[];
  activeValue?: string;
  paramName: string;
  basePath: string;
  /** value that means "all" — usually 'ALL' */
  allValue?: string;
  /** preserve other search params */
  extraParams?: Record<string, string | undefined>;
};

export function FilterChips({
  chips,
  activeValue,
  paramName,
  basePath,
  allValue = 'ALL',
  extraParams,
}: Props) {
  function buildHref(value: string) {
    const params = new URLSearchParams();
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        if (v) params.set(k, v);
      }
    }
    if (value !== allValue) params.set(paramName, value);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const current = activeValue ?? allValue;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => {
        const active = c.value === current;
        return (
          <Link
            key={c.value}
            href={buildHref(c.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
