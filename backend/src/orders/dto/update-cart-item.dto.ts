import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
