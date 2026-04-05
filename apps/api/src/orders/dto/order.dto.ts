import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsPositive,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryType, OrderStatus, PaymentMethod } from '@prisma/client';

export class OrderItemInputDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  unitPrice: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsDateString()
  deliveryDate: string;

  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsUUID()
  deliveryPersonId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsBoolean()
  depositRequired: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  depositAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class RegisterPaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsBoolean()
  isDeposit: boolean;
}
