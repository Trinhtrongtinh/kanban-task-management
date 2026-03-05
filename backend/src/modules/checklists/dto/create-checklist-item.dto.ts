import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateChecklistItemDto {
  @IsOptional()
  @IsUUID()
  checklistId?: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
