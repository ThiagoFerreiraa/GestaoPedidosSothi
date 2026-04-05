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
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateAddressDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/addresses')
  addAddress(@Param('id') id: string, @Body() dto: CreateAddressDto) {
    return this.customersService.addAddress(id, dto);
  }

  @Delete(':id/addresses/:addressId')
  removeAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.customersService.removeAddress(id, addressId);
  }
}
