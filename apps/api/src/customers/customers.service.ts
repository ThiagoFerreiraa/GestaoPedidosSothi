import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateAddressDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      include: { addresses: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { items: { include: { product: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: dto,
      include: { addresses: true },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: dto,
      include: { addresses: true },
    });
  }

  async addAddress(customerId: string, dto: CreateAddressDto) {
    await this.findOne(customerId);
    return this.prisma.customerAddress.create({
      data: { ...dto, customerId },
    });
  }

  async removeAddress(customerId: string, addressId: string) {
    return this.prisma.customerAddress.delete({
      where: { id: addressId, customerId },
    });
  }
}
