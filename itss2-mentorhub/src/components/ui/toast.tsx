'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ToastItem = { id: string; title?: string; description?: string; variant?: 'default' | 'destructive' };

const ToastContext = React.createContext<{ toast: (t: Omit<ToastItem, 'id'>) => void }>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {items.map((i) => (
          <div
            key={i.id}
            className={cn(
              'min-w-[280px] max-w-sm rounded-md border bg-card px-4 py-3 shadow-sm',
              i.variant === 'destructive' && 'border-destructive/30 bg-destructive/5',
            )}
          >
            {i.title && <div className="text-sm font-medium">{i.title}</div>}
            {i.description && <div className="text-sm text-muted-foreground">{i.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
