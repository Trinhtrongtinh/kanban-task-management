import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(16)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  newPassword: string;
}
