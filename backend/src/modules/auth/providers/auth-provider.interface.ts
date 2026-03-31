import { AuthProvider, User } from '../../../database/entities';
import { LoginDto, RegisterDto } from '../dto';

export interface SocialAuthProfile {
  email: string;
  username: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
}

export interface AuthProviderContract {
  readonly provider: AuthProvider;

  register(_registerDto: RegisterDto): Promise<User>;
  login(_loginDto: LoginDto): Promise<User>;
  authenticateSocial(_socialProfile: SocialAuthProfile): Promise<User>;
}
