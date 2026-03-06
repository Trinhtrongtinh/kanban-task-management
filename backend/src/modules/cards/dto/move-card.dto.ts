import { IsUUID, IsOptional } from 'class-validator';

export class MoveCardDto {
  @IsUUID()
  targetListId: string;

  @IsUUID()
  @IsOptional()
  prevCardId?: string;

  @IsUUID()
  @IsOptional()
  nextCardId?: string;

  @IsUUID()
  userId: string;
}
