'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/use-socket';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_ENTRADA: 'Aguardando Entrada',
  ENTRADA_CONFIRMADA: 'Entrada Confirmada',
  RECEBIDO: 'Recebido',
  EM_PRODUCAO: 'Em Produção',
  PRONTO: 'Pronto',
  EM_ENTREGA: 'Em Entrega',
  AGUARDANDO_RETIRADA: 'Aguardando Retirada',
  SALDO_PAGO: 'Saldo Pago',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AGUARDANDO_ENTRADA: 'outline',
  ENTRADA_CONFIRMADA: 'secondary',
  RECEBIDO: 'secondary',
  EM_PRODUCAO: 'default',
  PRONTO: 'default',
  EM_ENTREGA: 'secondary',
  AGUARDANDO_RETIRADA: 'secondary',
  SALDO_PAGO: 'secondary',
  ENTREGUE: 'outline',
  CANCELADO: 'destructive',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:created', (order: any) => {
      setOrders((prev) => [order, ...prev]);
      toast.info(`Novo pedido de ${order.customer.name}`);
    });
    socket.on('order:updated', (order: any) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    });
    return () => {
      socket.off('order:created');
      socket.off('order:updated');
    };
  }, [socket]);

  const activeOrders = orders.filter((o) => o.status !== 'ENTREGUE' && o.status !== 'CANCELADO');
  const closedOrders = orders.filter((o) => o.status === 'ENTREGUE' || o.status === 'CANCELADO');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button render={<Link href="/pedidos/novo" />}>
          <Plus className="size-4" />
          Novo Pedido
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Em Andamento
              <Badge variant="secondary" className="ml-1.5">{activeOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="closed">
              Concluídos
              <Badge variant="secondary" className="ml-1.5">{closedOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {activeOrders.length === 0 && (
                <p className="text-muted-foreground col-span-full py-8 text-center">
                  Nenhum pedido em andamento.
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="closed">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {closedOrders.slice(0, 12).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {closedOrders.length === 0 && (
                <p className="text-muted-foreground col-span-full py-8 text-center">
                  Nenhum pedido concluído.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };
  const deliveryDate = new Date(order.deliveryDate);
  const isUrgent =
    !['ENTREGUE', 'CANCELADO'].includes(order.status) &&
    deliveryDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Link href={`/pedidos/${order.id}`}>
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${isUrgent ? 'border-red-400' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{order.customer.name}</CardTitle>
            <Badge variant={STATUS_VARIANT[order.status] ?? 'outline'}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Entrega:</span>{' '}
            {formatDate(order.deliveryDate)}
            {isUrgent && (
              <Badge variant="destructive" className="ml-1.5 text-[10px]">
                Urgente
              </Badge>
            )}
          </p>
          <p>
            <span className="font-medium text-foreground">Modalidade:</span>{' '}
            {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'}
          </p>
          <p>
            <span className="font-medium text-foreground">Total:</span>{' '}
            R$ {Number(order.total).toFixed(2)}
          </p>
          {order.depositRequired && !order.depositPaidAt && (
            <Badge variant="outline" className="text-yellow-700 border-yellow-400">
              Entrada pendente
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
