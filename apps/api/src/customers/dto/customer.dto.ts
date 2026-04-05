import {
  IsString,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';
import { SourceChannel } from '@prisma/client';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEnum(SourceChannel)
  sourceChannel?: SourceChannel;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(SourceChannel)
  sourceChannel?: SourceChannel;
}

export class CreateAddressDto {
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
