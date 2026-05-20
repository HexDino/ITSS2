'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  MessagesSquare,
  Users,
  Building2,
  Briefcase,
  FileText,
  MessageCircle,
  UserCircle,
  ShieldCheck,
  BriefcaseBusiness,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const items = [
  { href: '/channels', key: 'channels', icon: MessagesSquare },
  { href: '/mentors', key: 'mentors', icon: Users },
  { href: '/companies', key: 'companies', icon: Building2 },
  { href: '/jobs', key: 'jobs', icon: Briefcase },
  { href: '/applications', key: 'applications', icon: FileText, roles: ['STUDENT'] },
  { href: '/employer', key: 'employer', icon: BriefcaseBusiness, roles: ['EMPLOYER', 'ADMIN'] },
  { href: '/chat', key: 'chat', icon: MessageCircle },
  { href: '/profile', key: 'profile', icon: UserCircle },
  { href: '/admin', key: 'admin', icon: ShieldCheck, roles: ['ADMIN'] },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const visible = items.filter((i) => !('roles' in i) || (i.roles && role && (i.roles as readonly string[]).includes(role)));

  return (
    <>
      <Link href="/channels" className="px-3 py-2 mb-2 block" onClick={onNavigate}>
        <div className="text-base font-semibold tracking-tight">MentorHub</div>
        <div className="text-xs text-muted-foreground">& StuBiz</div>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {visible.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-border bg-card/40 px-3 py-4">
      <SidebarNav />
    </aside>
  );
}
