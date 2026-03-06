import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateActivityLogDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  boardId: string;

  @IsUUID()
  @IsOptional()
  cardId?: string;

  @IsString()
  @MaxLength(50)
  action: string;

  @IsString()
  content: string;
}
