// Roles
export type Role = 'ADMIN' | 'ATENDENTE' | 'COZINHA' | 'ENTREGADOR';

// Order types
export type OrderType = 'ENCOMENDA' | 'LOTE_VENDA';

export type DeliveryType = 'DELIVERY' | 'RETIRADA';

export type PaymentMethod = 'PIX' | 'DINHEIRO';

export type OrderStatus =
  | 'AGUARDANDO_ENTRADA'
  | 'ENTRADA_CONFIRMADA'
  | 'RECEBIDO'
  | 'EM_PRODUCAO'
  | 'PRONTO'
  | 'EM_ENTREGA'
  | 'AGUARDANDO_RETIRADA'
  | 'SALDO_PAGO'
  | 'ENTREGUE'
  | 'CANCELADO';

export type SourceChannel = 'WHATSAPP' | 'INSTAGRAM' | 'OUTRO';

export type FinancialEntryType = 'RECEITA' | 'DESPESA';

export type ExpenseCategory = 'INGREDIENTES' | 'EMBALAGENS' | 'OUTROS';

// Auth
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

// User
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

// Product
export interface CategoryDto {
  id: string;
  name: string;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  seasonal: boolean;
  active: boolean;
  category: CategoryDto;
}

// Customer
export interface CustomerAddressDto {
  id: string;
  address: string;
  reference: string | null;
}

export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  sourceChannel: SourceChannel;
  addresses: CustomerAddressDto[];
}

// Order
export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
}

export interface OrderStatusHistoryDto {
  id: string;
  status: OrderStatus;
  changedBy: string;
  changedAt: string;
}

export interface OrderDto {
  id: string;
  type: OrderType;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryDate: string;
  addressId: string | null;
  deliveryPersonId: string | null;
  total: number;
  depositRequired: boolean;
  depositAmount: number | null;
  depositPaidAt: string | null;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  notes: string | null;
  customer: Pick<CustomerDto, 'id' | 'name' | 'phone'>;
  items: OrderItemDto[];
  statusHistory: OrderStatusHistoryDto[];
  createdAt: string;
}

// Weekend Batch
export interface WeekendBatchDto {
  id: string;
  weekendDate: string;
  plannedQty: number;
  producedQty: number;
  soldQty: number;
  product: Pick<ProductDto, 'id' | 'name' | 'price'>;
}
