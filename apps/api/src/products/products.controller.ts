import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  // Categories
  @Get('categories')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.productsService.deleteCategory(id);
  }

  // Products
  @Get()
  findAll(
    @Query('active') active?: string,
    @Query('seasonal') seasonal?: string,
  ) {
    return this.productsService.findAll(
      active !== undefined ? active === 'true' : undefined,
      seasonal !== undefined ? seasonal === 'true' : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    console.log('Received DTO in controller:', dto);
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }
}
