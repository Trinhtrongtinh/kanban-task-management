import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class GlobalSearchDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  q: string;
}
