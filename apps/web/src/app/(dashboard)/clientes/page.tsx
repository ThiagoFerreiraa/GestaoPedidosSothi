'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { Plus, Search, User } from 'lucide-react';

const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
  INDICACAO: 'Indicação',
  LOJA_FISICA: 'Loja Física',
  OUTRO: 'Outro',
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const SOURCE_VARIANT: Record<string, BadgeVariant> = {
  INSTAGRAM: 'default',
  WHATSAPP: 'default',
  INDICACAO: 'secondary',
  LOJA_FISICA: 'secondary',
  OUTRO: 'outline',
};

export default function ClientesPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', sourceChannel: 'WHATSAPP' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await api.get('/customers', {
        params: debouncedSearch ? { search: debouncedSearch } : {},
      });
      setCustomers(data);
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const createCustomer = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/customers', form);
      toast.success('Cliente criado');
      setDialogOpen(false);
      setForm({ name: '', phone: '', sourceChannel: 'WHATSAPP' });
      fetchCustomers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao criar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-3 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {customers.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/pedidos?customerId=${c.id}`)}
              >
                <CardContent className="pt-4 pb-3 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-muted-foreground text-xs">{c.phone}</p>
                    </div>
                  </div>
                  {c.sourceChannel && (
                    <Badge
                      variant={SOURCE_VARIANT[c.sourceChannel] ?? 'outline'}
                      className="text-xs"
                    >
                      {SOURCE_LABELS[c.sourceChannel] ?? c.sourceChannel}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {customers.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
            </p>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-1">
              <Label>Telefone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-1">
              <Label>Canal de origem</Label>
              <Select
                value={form.sourceChannel}
                onValueChange={(v) => setForm((f) => ({ ...f, sourceChannel: v ?? f.sourceChannel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => (
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
            <Button disabled={submitting} onClick={createCustomer}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
