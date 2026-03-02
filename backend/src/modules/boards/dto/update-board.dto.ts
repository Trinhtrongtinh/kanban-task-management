import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { BoardVisibility } from '../../../database/entities/board.entity';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsUrl()
  @IsOptional()
  backgroundUrl?: string;

  @IsEnum(BoardVisibility)
  @IsOptional()
  visibility?: BoardVisibility;
}
