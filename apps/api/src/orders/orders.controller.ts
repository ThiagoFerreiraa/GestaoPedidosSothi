import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  RegisterPaymentDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ATENDENTE)
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ordersService.create(dto, user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ATENDENTE, Role.COZINHA, Role.ENTREGADOR)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ordersService.updateStatus(id, dto, user.id);
  }

  @Patch(':id/payment')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ATENDENTE)
  registerPayment(
    @Param('id') id: string,
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ordersService.registerPayment(id, dto, user.id);
  }
}
