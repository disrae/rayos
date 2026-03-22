'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export function PageHeader({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { user, signOut } = useAuth();

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={24} height={24} />
          <span className="text-lg font-semibold tracking-tight text-foreground">Rayos</span>
        </Link>
        {children}
      </div>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {getInitials(user.firstName, user.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.firstName ?? 'Account'}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/sign-in">Sign in</a>
          </Button>
          <Button size="sm" asChild>
            <a href="/sign-up">Sign up</a>
          </Button>
        </div>
      )}
    </header>
  );
}
