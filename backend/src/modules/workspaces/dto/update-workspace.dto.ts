import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { WorkspaceType } from '../../../database/entities/workspace.entity';

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(WorkspaceType)
  @IsOptional()
  type?: WorkspaceType;
}
