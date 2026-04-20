import { Repository } from 'typeorm';
import { AuthProvider, User } from '../../../database/entities';
import { SocialAuthProfile } from './auth-provider.interface';
export declare class AuthUserProvisioningService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findOrCreateUser(provider: AuthProvider, socialProfile: SocialAuthProfile): Promise<User>;
    private buildUsername;
}
