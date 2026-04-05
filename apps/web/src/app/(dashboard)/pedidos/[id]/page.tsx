'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/use-socket';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, CircleCheck, CircleDot, Clock, Truck } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_ENTRADA: 'Aguardando Entrada',
  RECEBIDO: 'Recebido',
  ENTRADA_CONFIRMADA: 'Entrada Confirmada',
  EM_PRODUCAO: 'Em Produção',
  PRONTO: 'Pronto',
  SAIU_PARA_ENTREGA: 'Saiu para Entrega',
  PRONTO_PARA_RETIRADA: 'Pronto para Retirada',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  AGUARDANDO_ENTRADA: 'outline',
  RECEBIDO: 'secondary',
  ENTRADA_CONFIRMADA: 'secondary',
  EM_PRODUCAO: 'default',
  PRONTO: 'default',
  SAIU_PARA_ENTREGA: 'default',
  PRONTO_PARA_RETIRADA: 'default',
  ENTREGUE: 'outline',
  CANCELADO: 'destructive',
  REEMBOLSADO: 'destructive',
};

const NEXT_ACTIONS: Record<string, { label: string; status: string }[]> = {
  AGUARDANDO_ENTRADA: [
    { label: 'Confirmar Entrada', status: 'ENTRADA_CONFIRMADA' },
    { label: 'Cancelar Pedido', status: 'CANCELADO' },
  ],
  RECEBIDO: [
    { label: 'Confirmar Entrada', status: 'ENTRADA_CONFIRMADA' },
    { label: 'Cancelar Pedido', status: 'CANCELADO' },
  ],
  ENTRADA_CONFIRMADA: [{ label: 'Iniciar Produção', status: 'EM_PRODUCAO' }],
  EM_PRODUCAO: [{ label: 'Marcar como Pronto', status: 'PRONTO' }],
  PRONTO: [
    { label: 'Saiu para Entrega', status: 'SAIU_PARA_ENTREGA' },
    { label: 'Pronto para Retirada', status: 'PRONTO_PARA_RETIRADA' },
  ],
  SAIU_PARA_ENTREGA: [{ label: 'Marcar como Entregue', status: 'ENTREGUE' }],
  PRONTO_PARA_RETIRADA: [{ label: 'Marcar como Entregue', status: 'ENTREGUE' }],
};

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
];

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const socket = useSocket();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [isDeposit, setIsDeposit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch {
      toast.error('Pedido não encontrado');
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:updated', (updated: any) => {
      if (updated.id === id) setOrder(updated);
    });
    return () => {
      socket.off('order:updated');
    };
  }, [socket, id]);

  const updateStatus = async (status: string) => {
    setSubmitting(true);
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status });
      setOrder(data);
      toast.success('Status atualizado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao atualizar status');
    } finally {
      setSubmitting(false);
    }
  };

  const registerPayment = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.patch(`/orders/${id}/payment`, {
        paymentMethod,
        isDeposit,
      });
      setOrder(data);
      setPaymentDialogOpen(false);
      toast.success('Pagamento registrado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao registrar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) return <DetailSkeleton />;
  if (!order) return null;

  const actions = NEXT_ACTIONS[order.status] ?? [];
  const cancelAction = actions.find((a) => a.status === 'CANCELADO');
  const progressActions = actions.filter((a) => a.status !== 'CANCELADO');
  const canRegisterPayment =
    (user?.role === 'ADMIN' || user?.role === 'ATENDENTE') &&
    !['CANCELADO', 'REEMBOLSADO'].includes(order.status);
  const depositPending = order.depositRequired && !order.depositPaidAt;
  const totalPaid =
    order.financialEntries?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) ?? 0;
  const remaining = Number(order.total) - totalPaid;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <Badge variant={STATUS_VARIANT[order.status] ?? 'outline'}>
          {STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {/* Customer + meta */}
      <Card>
        <CardHeader>
          <CardTitle>Pedido #{order.id.slice(-6).toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Cliente:</span>{' '}
            <strong>{order.customer.name}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Telefone:</span> {order.customer.phone}
          </p>
          <p>
            <span className="text-muted-foreground">Tipo:</span>{' '}
            <Badge variant="outline" className="ml-1 text-xs">
              {order.deliveryType === 'DELIVERY' ? (
                <>
                  <Truck className="size-3" /> Entrega
                </>
              ) : (
                'Retirada'
              )}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">Data de entrega:</span>{' '}
            {formatDate(order.deliveryDate)}
          </p>
          {order.notes && (
            <p>
              <span className="text-muted-foreground">Observações:</span> {order.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium">Produto</th>
                  <th className="text-center px-3 py-2 font-medium">Qtd</th>
                  <th className="text-right px-3 py-2 font-medium">Unitário</th>
                  <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      {item.product.name}
                      {item.notes && (
                        <span className="text-muted-foreground text-xs ml-1">({item.notes})</span>
                      )}
                    </td>
                    <td className="text-center px-3 py-2">{item.quantity}</td>
                    <td className="text-right px-3 py-2">
                      {Number(item.unitPrice).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="text-right px-3 py-2 font-medium">
                      {(Number(item.unitPrice) * item.quantity).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {Number(order.total).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {order.depositRequired && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sinal:</span>
              {Number(order.depositAmount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              {order.depositPaidAt ? (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  Pago
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Pendente
                </Badge>
              )}
            </div>
          )}
          <p>
            <span className="text-muted-foreground">Total pago:</span>{' '}
            {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          {remaining > 0.01 && (
            <p>
              <span className="text-muted-foreground">Restante:</span>{' '}
              <span className="text-red-600 font-medium">
                {remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </p>
          )}
          {canRegisterPayment && remaining > 0.01 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeposit(depositPending);
                setPaymentDialogOpen(true);
              }}
            >
              Registrar Pagamento
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Status timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-muted ml-2 space-y-4 text-sm">
            {order.statusHistory?.map((h: any, idx: number) => {
              const isLast = idx === order.statusHistory.length - 1;
              return (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-[7px] mt-0.5">
                    {isLast ? (
                      <CircleDot className="size-3.5 text-primary" />
                    ) : (
                      <CircleCheck className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium">{STATUS_LABELS[h.toStatus]}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(h.createdAt).toLocaleString('pt-BR')}
                    {h.changedBy && ` · ${h.changedBy.name}`}
                  </p>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {(progressActions.length > 0 || cancelAction) && (
        <div className="flex gap-2 flex-wrap">
          {progressActions.map((action) => (
            <Button
              key={action.status}
              disabled={submitting}
              onClick={() => updateStatus(action.status)}
            >
              {action.label}
            </Button>
          ))}
          {cancelAction && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" disabled={submitting} />
                }
              >
                {cancelAction.label}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O pedido será marcado como cancelado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => updateStatus('CANCELADO')}>
                    Confirmar Cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {order.depositRequired && depositPending && (
              <RadioGroup
                value={isDeposit ? 'deposit' : 'remaining'}
                onValueChange={(v) => setIsDeposit(v === 'deposit')}
                className="gap-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="deposit" id="r-deposit" />
                  <Label htmlFor="r-deposit">
                    Sinal (
                    {Number(order.depositAmount).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    )
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="remaining" id="r-remaining" />
                  <Label htmlFor="r-remaining">Valor restante</Label>
                </div>
              </RadioGroup>
            )}
            <div className="space-y-1">
              <Label>Forma de pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v ?? paymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={submitting} onClick={registerPayment}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
