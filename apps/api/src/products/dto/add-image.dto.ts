import { IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class AddImageDto {
  @IsUrl()
  url: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
