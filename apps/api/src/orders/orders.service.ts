import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  RegisterPaymentDto,
} from './dto/order.dto';
import { OrdersGateway } from '../websocket/orders.gateway';

const ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, phone: true } },
  address: true,
  deliveryPerson: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  items: { include: { product: { select: { id: true, name: true } } } },
  statusHistory: {
    orderBy: { changedAt: 'desc' as const },
    include: { changedBy: { select: { id: true, name: true } } },
  },
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: OrdersGateway,
  ) {}

  async findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { ...(status && { status }) },
      include: ORDER_INCLUDE,
      orderBy: { deliveryDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async create(dto: CreateOrderDto, createdById: string) {
    const total = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const initialStatus: OrderStatus = dto.depositRequired
      ? OrderStatus.AGUARDANDO_ENTRADA
      : OrderStatus.RECEBIDO;

    const order = await this.prisma.order.create({
      data: {
        customerId: dto.customerId,
        deliveryType: dto.deliveryType,
        deliveryDate: new Date(dto.deliveryDate),
        addressId: dto.addressId,
        deliveryPersonId: dto.deliveryPersonId,
        notes: dto.notes,
        total,
        depositRequired: dto.depositRequired,
        depositAmount: dto.depositAmount,
        status: initialStatus,
        createdById,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
        },
        statusHistory: {
          create: { status: initialStatus, changedById: createdById },
        },
      },
      include: ORDER_INCLUDE,
    });

    this.gateway.emitOrderCreated(order);
    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    changedById: string,
  ) {
    const order = await this.findOne(id);
    this.validateStatusTransition(order.status, dto.status);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        statusHistory: {
          create: { status: dto.status, changedById },
        },
      },
      include: ORDER_INCLUDE,
    });

    this.gateway.emitOrderUpdated(updated);
    return updated;
  }

  async registerPayment(
    id: string,
    dto: RegisterPaymentDto,
    userId: string,
  ) {
    const order = await this.findOne(id);

    const data: any = { paymentMethod: dto.paymentMethod };
    let newStatus: OrderStatus | undefined;

    if (dto.isDeposit) {
      if (!order.depositRequired) {
        throw new BadRequestException(
          'Este pedido não requer entrada',
        );
      }
      data.depositPaidAt = new Date();
      newStatus = OrderStatus.ENTRADA_CONFIRMADA;
    } else {
      data.paidAt = new Date();
      newStatus = OrderStatus.SALDO_PAGO;
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...data,
        ...(newStatus && { status: newStatus }),
        ...(newStatus && {
          statusHistory: {
            create: { status: newStatus, changedById: userId },
          },
        }),
      },
      include: ORDER_INCLUDE,
    });

    // Create financial receipt entry
    const amount = dto.isDeposit
      ? Number(order.depositAmount)
      : Number(order.total) - Number(order.depositAmount ?? 0);

    await this.prisma.financialEntry.create({
      data: {
        type: 'RECEITA',
        amount,
        description: dto.isDeposit
          ? `Entrada encomenda #${id.slice(-6)}`
          : `Saldo encomenda #${id.slice(-6)}`,
        referenceId: id,
        referenceType: 'order',
        date: new Date(),
        createdById: userId,
      },
    });

    this.gateway.emitOrderUpdated(updated);
    return updated;
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.AGUARDANDO_ENTRADA]: [
        OrderStatus.ENTRADA_CONFIRMADA,
        OrderStatus.CANCELADO,
      ],
      [OrderStatus.ENTRADA_CONFIRMADA]: [
        OrderStatus.EM_PRODUCAO,
        OrderStatus.CANCELADO,
      ],
      [OrderStatus.RECEBIDO]: [OrderStatus.EM_PRODUCAO, OrderStatus.CANCELADO],
      [OrderStatus.EM_PRODUCAO]: [OrderStatus.PRONTO, OrderStatus.CANCELADO],
      [OrderStatus.PRONTO]: [
        OrderStatus.EM_ENTREGA,
        OrderStatus.AGUARDANDO_RETIRADA,
        OrderStatus.CANCELADO,
      ],
      [OrderStatus.EM_ENTREGA]: [
        OrderStatus.SALDO_PAGO,
        OrderStatus.ENTREGUE,
        OrderStatus.CANCELADO,
      ],
      [OrderStatus.AGUARDANDO_RETIRADA]: [
        OrderStatus.SALDO_PAGO,
        OrderStatus.ENTREGUE,
        OrderStatus.CANCELADO,
      ],
      [OrderStatus.SALDO_PAGO]: [OrderStatus.ENTREGUE],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Transição de status inválida: ${current} → ${next}`,
      );
    }
  }
}
