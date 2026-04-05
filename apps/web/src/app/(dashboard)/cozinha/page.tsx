'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { ArrowRight, ChefHat, Clock } from 'lucide-react';

const KITCHEN_STATUSES = ['RECEBIDO', 'ENTRADA_CONFIRMADA', 'EM_PRODUCAO', 'PRONTO'];

const STATUS_LABELS: Record<string, string> = {
  RECEBIDO: 'Recebido',
  ENTRADA_CONFIRMADA: 'Entrada Confirmada',
  EM_PRODUCAO: 'Em Produção',
  PRONTO: 'Pronto',
};

const NEXT_STATUS: Record<string, string> = {
  RECEBIDO: 'EM_PRODUCAO',
  ENTRADA_CONFIRMADA: 'EM_PRODUCAO',
  EM_PRODUCAO: 'PRONTO',
};

function KitchenSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-3 pb-3 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-7 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function CozinhaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchOrders = async () => {
    try {
      const results = await Promise.all(
        KITCHEN_STATUSES.map((s) => api.get(`/orders?status=${s}`).then((r) => r.data)),
      );
      setOrders(results.flat());
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
      if (KITCHEN_STATUSES.includes(order.status)) {
        setOrders((prev) => [...prev, order]);
        const audio = new Audio('/sounds/new-order.mp3');
        audio.play().catch(() => {});
      }
    });
    socket.on('order:updated', (order: any) => {
      setOrders((prev) => {
        if (!KITCHEN_STATUSES.includes(order.status)) {
          return prev.filter((o) => o.id !== order.id);
        }
        const exists = prev.find((o) => o.id === order.id);
        return exists ? prev.map((o) => (o.id === order.id ? order : o)) : [...prev, order];
      });
    });
    return () => {
      socket.off('order:created');
      socket.off('order:updated');
    };
  }, [socket]);

  const advance = async (orderId: string, nextStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const columns = KITCHEN_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    orders: orders
      .filter((o) => o.status === status)
      .sort(
        (a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime(),
      ),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ChefHat className="size-6" />
        <h1 className="text-2xl font-bold">Painel da Cozinha</h1>
      </div>

      {loading ? (
        <KitchenSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">{col.label}</h2>
                <Badge variant="secondary" className="text-xs">
                  {col.orders.length}
                </Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-3 pr-2">
                  {col.orders.map((order) => {
                    const deliveryDate = new Date(order.deliveryDate);
                    const isUrgent =
                      deliveryDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;
                    const next = NEXT_STATUS[order.status];
                    return (
                      <Card
                        key={order.id}
                        className={`text-sm ${isUrgent ? 'border-red-400' : ''}`}
                      >
                        <CardHeader className="pb-1 pt-3 px-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            {order.customer.name}
                            {isUrgent && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    <Clock className="size-3" />
                                    Urgente
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Entrega em menos de 24h
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 space-y-2">
                          <p className="text-muted-foreground text-xs">
                            Entrega: {deliveryDate.toLocaleDateString('pt-BR')}
                          </p>
                          <ul className="text-xs space-y-0.5">
                            {order.items.map((item: any) => (
                              <li key={item.id}>
                                <span className="font-medium">{item.quantity}×</span>{' '}
                                {item.product.name}
                                {item.notes && (
                                  <span className="text-muted-foreground"> ({item.notes})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                          {next && (
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs"
                              onClick={() => advance(order.id, next)}
                            >
                              <ArrowRight className="size-3" />
                              {STATUS_LABELS[next]}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {col.orders.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Vazio</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
