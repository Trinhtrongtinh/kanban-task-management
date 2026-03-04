import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class UpdateListDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsNumber()
  @IsOptional()
  position?: number;
}
