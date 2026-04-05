'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <span className="text-sm font-medium text-muted-foreground">
              {user.name} · {user.role}
            </span>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </TooltipProvider>
  );
}
