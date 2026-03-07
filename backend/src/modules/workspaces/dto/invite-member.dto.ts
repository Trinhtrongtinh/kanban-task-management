import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '../../../common/enums';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsEnum(WorkspaceRole, { message: 'Role không hợp lệ' })
  @IsNotEmpty({ message: 'Role không được để trống' })
  role: WorkspaceRole;
}
