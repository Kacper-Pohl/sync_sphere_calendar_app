'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LayoutDashboard, Settings, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Kalendarz', href: '/dashboard/calendar', icon: CalendarDays },
    { name: 'Grupy', href: '/dashboard/groups', icon: Users },
    { name: 'Ustawienia', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div
      data-testid="sidebar"
      className="flex h-screen w-64 flex-col border-r bg-card/60 backdrop-blur-xl"
    >
      <div className="flex h-16 shrink-0 items-center justify-center border-b">
        <h1
          data-testid="sidebar-title"
          className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-xl font-bold text-transparent"
        >
          SyncSphere
        </h1>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              data-testid={`sidebar-link-${item.name.toLowerCase()}`}
            >
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'shadow-md shadow-primary/20',
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          data-testid="sidebar-logout"
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Wyloguj
        </Button>
      </div>
    </div>
  );
}
