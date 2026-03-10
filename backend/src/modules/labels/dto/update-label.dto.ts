import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class UpdateLabelDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'colorCode must be a valid HEX color code (e.g., #FF0000)',
  })
  colorCode?: string;
}
