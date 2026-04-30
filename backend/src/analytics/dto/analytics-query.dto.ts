import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum Period {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class AnalyticsQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsEnum(Period)
  @IsOptional()
  period?: Period = Period.DAY;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
