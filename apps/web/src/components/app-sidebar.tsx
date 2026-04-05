'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  ChefHat,
  Users,
  Package,
  UserCog,
  LogOut,
  ChevronsUpDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { label: 'Pedidos', href: '/pedidos', icon: ClipboardList, roles: ['ADMIN', 'ATENDENTE', 'ENTREGADOR'] },
  { label: 'Cozinha', href: '/cozinha', icon: ChefHat, roles: ['ADMIN', 'COZINHA', 'ATENDENTE'] },
  { label: 'Clientes', href: '/clientes', icon: Users, roles: ['ADMIN', 'ATENDENTE'] },
  { label: 'Produtos', href: '/produtos', icon: Package, roles: ['ADMIN'] },
  { label: 'Usuários', href: '/usuarios', icon: UserCog, roles: ['ADMIN'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/pedidos" />} tooltip="Gestão de Pedidos">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ClipboardList className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Gestão de Pedidos</span>
                <span className="truncate text-xs text-muted-foreground">Painel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar size="sm">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.role}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar size="sm">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
