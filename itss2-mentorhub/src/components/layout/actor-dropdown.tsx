'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface Actor {
  id: string;
  role: string;
  name: string;
  image: string | null;
  email: string;
  isGuest: boolean;
}

interface Animal {
  name: string;
  emoji: string;
  hue: number;
}

export function ActorDropdown({
  actor,
  animal,
}: {
  actor: Actor | null;
  animal: Animal;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/channels' });
    router.refresh();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            Admin
          </span>
        );
      case 'MENTOR':
        return (
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Cố vấn
          </span>
        );
      case 'EMPLOYER':
        return (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Doanh nghiệp
          </span>
        );
      default:
        return (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Sinh viên
          </span>
        );
    }
  };

  if (actor && !actor.isGuest) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 py-1 pl-1 pr-3 hover:bg-accent/80 transition-all focus:outline-none focus:ring-1 focus:ring-ring">
            <Avatar className="h-7 w-7">
              {actor.image && <AvatarImage src={actor.image} alt={actor.name} />}
              <AvatarFallback className="text-[10px]">{initials(actor.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-xs font-semibold leading-none sm:inline max-w-[100px] truncate">
              {actor.name}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2">
          <DropdownMenuLabel className="font-normal px-2 py-1.5">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold truncate max-w-[150px]">{actor.name}</span>
                {getRoleBadge(actor.role)}
              </div>
              <span className="text-xs text-muted-foreground truncate">{actor.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2 px-2 rounded-md"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-semibold">Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 py-1 pl-1 pr-3 hover:bg-accent/80 transition-all focus:outline-none focus:ring-1 focus:ring-ring"
          title={`Bạn đang xem ẩn danh dưới danh tính ${animal.name}`}
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full text-base shadow-inner"
            style={{
              backgroundColor: `hsl(${animal.hue} 70% 90%)`,
              color: `hsl(${animal.hue} 80% 25%)`,
            }}
          >
            {animal.emoji}
          </span>
          <span className="hidden text-xs font-semibold leading-none sm:inline">
            {animal.name}
            <span className="ml-1 text-[9px] uppercase tracking-wider text-muted-foreground bg-muted/60 px-1 py-0.5 rounded">
              ẩn danh
            </span>
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" /> Khách Ẩn Danh
            </span>
            <span className="text-xs text-muted-foreground">
              Xem dưới danh nghĩa: <strong>{animal.emoji} {animal.name}</strong>
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="p-0">
          <Button variant="ghost" size="sm" asChild className="w-full justify-start text-xs font-semibold px-2 py-1.5 hover:bg-accent rounded-md">
            <Link href="/login">Đăng nhập tài khoản</Link>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
