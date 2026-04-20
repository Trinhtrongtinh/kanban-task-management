import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export enum ActivityTimeFilter {
  TODAY = 'today',
  WEEK = 'week',
  ALL = 'all',
}

export class GetActivitiesQueryDto {
  @IsOptional()
  @IsEnum(ActivityTimeFilter)
  filter: ActivityTimeFilter = ActivityTimeFilter.ALL;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsISO8601()
  cursor?: string;
}
