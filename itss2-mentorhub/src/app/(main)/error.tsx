'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-semibold">Đã có lỗi xảy ra</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'Vui lòng thử lại sau ít phút.'}
      </p>
      <Button onClick={reset} size="sm">
        Thử lại
      </Button>
    </div>
  );
}
