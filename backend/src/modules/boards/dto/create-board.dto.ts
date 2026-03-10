import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BoardVisibility } from '../../../database/entities/board.entity';

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsString()
  @IsOptional()
  backgroundUrl?: string;

  @IsEnum(BoardVisibility)
  @IsOptional()
  visibility?: BoardVisibility;

  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;
}
