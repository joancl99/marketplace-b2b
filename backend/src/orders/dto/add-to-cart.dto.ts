import { IsInt, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
