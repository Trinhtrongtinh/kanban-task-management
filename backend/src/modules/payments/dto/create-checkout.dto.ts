import { IsString, IsOptional } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsOptional()
  priceId?: string;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}
