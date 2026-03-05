import { IsNotEmpty, IsString, IsArray, ValidateNested, ArrayMinSize, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistItemContentDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsInt()
  @Min(1)
  position: number;
}

export class BulkCreateChecklistItemDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemContentDto)
  items: ChecklistItemContentDto[];
}
