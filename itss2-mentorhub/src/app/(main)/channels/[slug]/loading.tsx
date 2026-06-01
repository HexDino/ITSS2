import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Loading state hiển thị ngay khi click vào kênh, tránh cảm giác lag/đơ.
export default function Loading() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="h-7 w-72 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
      </header>

      <div className="h-9 w-full max-w-md animate-pulse rounded-md bg-muted" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
