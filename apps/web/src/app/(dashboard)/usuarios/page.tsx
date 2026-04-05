'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Shield, UserPlus } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDENTE: 'Atendente',
  COZINHA: 'Cozinha',
  ENTREGADOR: 'Entregador',
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const ROLE_VARIANT: Record<string, BadgeVariant> = {
  ADMIN: 'default',
  ATENDENTE: 'secondary',
  COZINHA: 'outline',
  ENTREGADOR: 'outline',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function UsuariosPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ATENDENTE',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'ATENDENTE' });
    setDialogOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setDialogOpen(true);
  };

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios');
      return;
    }
    if (!editingUser && !form.password.trim()) {
      toast.error('Senha é obrigatória para novo usuário');
      return;
    }
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: Record<string, string> = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password.trim()) payload.password = form.password;
        await api.patch(`/users/${editingUser.id}`, payload);
        toast.success('Usuário atualizado');
      } else {
        await api.post('/users', form);
        toast.success('Usuário criado');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Button onClick={openCreate}>
          <UserPlus className="size-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="size-8 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              : users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {getInitials(u.name)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {u.name}
                      {u.id === me?.id && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                          você
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[u.role] ?? 'outline'}>
                        {u.role === 'ADMIN' && <Shield className="size-3" />}
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {!loading && users.length === 0 && (
        <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado.</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-1">
              <Label>{editingUser ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v ?? f.role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={submitting} onClick={saveUser}>
              {editingUser ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
