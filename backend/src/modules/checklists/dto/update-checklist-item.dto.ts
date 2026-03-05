import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isDone?: boolean;

  @IsOptional()
  @IsInt()
  position?: number;
}
