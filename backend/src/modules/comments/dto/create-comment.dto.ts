import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  mentionedUserIds?: string[];
}
