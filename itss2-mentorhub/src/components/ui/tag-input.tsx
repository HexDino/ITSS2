'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder,
  max = 30,
  maxLength = 40,
  disabled,
  className,
  id,
}: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commit(raw: string) {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) {
      const tag = p.slice(0, maxLength);
      if (!next.some((t) => t.toLowerCase() === tag.toLowerCase()) && next.length < max) {
        next.push(tag);
      }
    }
    onChange(next);
    setDraft('');
  }

  function removeAt(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeAt(value.length - 1);
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-within:ring-1 focus-within:ring-ring',
        disabled && 'opacity-50',
        className,
      )}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-xs"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => removeAt(i)}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        id={id}
        type="text"
        className="flex-1 min-w-[8ch] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        placeholder={value.length === 0 ? placeholder : ''}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
      />
    </div>
  );
}
