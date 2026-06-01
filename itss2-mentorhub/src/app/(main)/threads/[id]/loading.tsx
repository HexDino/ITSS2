import { Card, CardContent } from '@/components/ui/card';

// Loading state cho trang chi tiết chủ đề (skeleton).
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-3 w-64 animate-pulse rounded bg-muted" />

      <Card className="overflow-hidden">
        <div className="h-9 border-b border-border bg-muted/40" />
        <CardContent className="space-y-4 py-5">
          <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="space-y-1">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>

      <div className="h-6 w-40 animate-pulse rounded bg-muted" />

      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="space-y-1">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
