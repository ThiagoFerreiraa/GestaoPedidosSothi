import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  name!: string;
}

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  seasonal?: boolean;

  @IsUUID()
  categoryId!: string;

  @IsBoolean()
  active?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  seasonal?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
