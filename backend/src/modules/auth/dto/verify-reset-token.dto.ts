import { IsString, MinLength } from 'class-validator';

export class VerifyResetTokenDto {
  @IsString()
  @MinLength(16)
  token: string;
}
