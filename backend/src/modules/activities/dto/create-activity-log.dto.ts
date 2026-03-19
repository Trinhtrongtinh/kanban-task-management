import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ActivityAction } from '../../../common/enums';

export class CreateActivityLogDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  boardId?: string;

  @IsOptional()
  @IsUUID()
  cardId?: string;

  @IsEnum(ActivityAction)
  action: ActivityAction;

  @IsString()
  @MaxLength(255)
  entityTitle: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  content: string;
}
