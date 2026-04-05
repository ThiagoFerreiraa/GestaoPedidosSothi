import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async findAllCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  // Products
  async findAll(onlyActive?: boolean, onlySeasonal?: boolean) {
    return this.prisma.product.findMany({
      where: {
        ...(onlyActive !== undefined && { active: onlyActive }),
        ...(onlySeasonal !== undefined && { seasonal: onlySeasonal }),
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async create(dto: CreateProductDto) {
    console.log('Creating product with data:', dto);
    return this.prisma.product.create({
      data: dto,
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }
}
