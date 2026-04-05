'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'react-day-picker/locale';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { CalendarIcon, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NovoPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    deliveryType: 'DELIVERY',
    deliveryDate: undefined as Date | undefined,
    notes: '',
    depositRequired: false,
    depositAmount: '',
  });

  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0, notes: '' }]);

  useEffect(() => {
    Promise.all([
      api.get('/customers').then((r) => setCustomers(r.data)),
      api.get('/products?active=true').then((r) => setProducts(r.data)),
    ]).catch(() => toast.error('Erro ao carregar dados'));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  const addItem = () =>
    setItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: 0, notes: '' }]);

  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const product = products.find((p) => p.id === value);
          updated.unitPrice = product ? Number(product.price) : 0;
        }
        return updated;
      }),
    );
  };

  const total = items.reduce((s, i) => s + Number(i.unitPrice) * Number(i.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) {
      toast.error('Selecione um cliente');
      return;
    }
    if (!form.deliveryDate) {
      toast.error('Selecione a data de entrega');
      return;
    }
    if (items.some((i) => !i.productId)) {
      toast.error('Selecione um produto em cada linha');
      return;
    }
    setLoading(true);
    try {
      await api.post('/orders', {
        ...form,
        deliveryDate: form.deliveryDate.toISOString().split('T')[0],
        depositRequired: form.depositRequired,
        depositAmount: form.depositRequired ? Number(form.depositAmount) : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          notes: i.notes || undefined,
        })),
      });
      toast.success('Pedido criado com sucesso!');
      router.push('/pedidos');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Novo Pedido</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Combobox
                value={selectedCustomer ?? null}
                onValueChange={(val) => {
                  setForm((f) => ({ ...f, customerId: val?.id ?? '' }));
                }}
                items={customers}
                itemToStringValue={(c) => `${c.name} · ${c.phone}`}
              >
                <ComboboxInput placeholder="Buscar cliente..." />
                <ComboboxContent>
                  <ComboboxEmpty>Nenhum cliente encontrado.</ComboboxEmpty>
                  <ComboboxList>
                    {(customer) => (
                      <ComboboxItem key={customer.id} value={customer}>
                        {customer.name} · {customer.phone}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modalidade *</Label>
                <Select
                  value={form.deliveryType}
                  onValueChange={(v) => setForm((f) => ({ ...f, deliveryType: v ?? f.deliveryType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELIVERY">Delivery</SelectItem>
                    <SelectItem value="RETIRADA">Retirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Entrega *</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        data-empty={!form.deliveryDate}
                        className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                      />
                    }
                  >
                    <CalendarIcon className="size-4" />
                    {form.deliveryDate ? format(form.deliveryDate, "dd/MM/yyyy") : <span>Selecione</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.deliveryDate}
                      onSelect={(date) => setForm((f) => ({ ...f, deliveryDate: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações gerais do pedido"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, i) => {
              const selectedProduct = products.find((p) => p.id === item.productId);
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Produto</Label>
                    <Combobox
                      value={selectedProduct ?? null}
                      onValueChange={(val) => updateItem(i, 'productId', val?.id ?? '')}
                      items={products}
                      itemToStringValue={(p) => p.name}
                    >
                      <ComboboxInput placeholder="Buscar produto..." />
                      <ComboboxContent>
                        <ComboboxEmpty>Nenhum produto.</ComboboxEmpty>
                        <ComboboxList>
                          {(product) => (
                            <ComboboxItem key={product.id} value={product}>
                              {product.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Preço</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Obs</Label>
                    <Input
                      placeholder="..."
                      value={item.notes}
                      onChange={(e) => updateItem(i, 'notes', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                          />
                        }
                      >
                        <Trash2 className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent>Remover produto</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-4" />
              Adicionar produto
            </Button>
            <p className="text-right font-semibold">Total: R$ {total.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento / Entrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={form.depositRequired}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, depositRequired: !!checked }))}
              />
              <Label>Cobrar entrada</Label>
            </div>
            {form.depositRequired && (
              <div className="space-y-2">
                <Label>Valor da entrada (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.depositAmount}
                  onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))}
                  required={form.depositRequired}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Pedido'}
          </Button>
        </div>
      </form>
    </div>
  );
}
