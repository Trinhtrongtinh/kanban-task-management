import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'colorCode must be a valid HEX color code (e.g., #FF0000)',
  })
  colorCode: string;

  @IsUUID()
  @IsNotEmpty()
  boardId: string;
}
