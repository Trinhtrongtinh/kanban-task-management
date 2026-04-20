import { IsBoolean } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsBoolean()
  notifyDueDateEmail: boolean;

  @IsBoolean()
  notifyMentionEmail: boolean;
}
