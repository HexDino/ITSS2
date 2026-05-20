import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-5xl font-bold text-muted-foreground">404</h1>
      <p className="text-sm text-muted-foreground">Không tìm thấy trang.</p>
      <Button asChild size="sm">
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
