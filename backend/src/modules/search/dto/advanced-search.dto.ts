import { IsOptional, IsUUID, IsArray, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum DueDateFilter {
  OVERDUE = 'overdue', // Đã quá hạn
  DUE_SOON = 'due_soon', // Sắp tới hạn (trong 7 ngày)
  NO_DEADLINE = 'no_deadline', // Không có deadline
}

export class AdvancedSearchDto {
  @IsOptional()
  @IsUUID()
  boardId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  labelIds?: string[];

  @IsOptional()
  @IsEnum(DueDateFilter)
  dueDate?: DueDateFilter;
}
