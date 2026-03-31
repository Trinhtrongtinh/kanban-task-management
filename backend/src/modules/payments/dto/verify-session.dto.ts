import { IsString, IsNotEmpty } from 'class-validator';

export class VerifySessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
