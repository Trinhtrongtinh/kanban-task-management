import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsUUID()
  @IsNotEmpty()
  boardId: string;
}
