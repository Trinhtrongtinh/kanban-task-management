import { AuthProvider, User } from '../../../database/entities';
import { LoginDto, RegisterDto } from '../dto';
import { AuthProviderContract, SocialAuthProfile } from './auth-provider.interface';
import { AuthUserProvisioningService } from './auth-user-provisioning.service';
export declare class GoogleAuthProvider implements AuthProviderContract {
    private readonly authUserProvisioningService;
    readonly provider = AuthProvider.GOOGLE;
    constructor(authUserProvisioningService: AuthUserProvisioningService);
    register(_registerDto: RegisterDto): Promise<User>;
    login(_loginDto: LoginDto): Promise<User>;
    authenticateSocial(socialProfile: SocialAuthProfile): Promise<User>;
}
