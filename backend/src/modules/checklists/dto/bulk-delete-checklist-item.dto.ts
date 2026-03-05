import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class BulkDeleteChecklistItemDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids: string[];
}
