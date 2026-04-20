import { Repository } from 'typeorm';
import { AuthProvider, User } from '../../../database/entities';
import { LoginDto, RegisterDto } from '../dto';
import { AuthProviderContract, SocialAuthProfile } from './auth-provider.interface';
export declare class LocalAuthProvider implements AuthProviderContract {
    private readonly userRepository;
    readonly provider = AuthProvider.LOCAL;
    constructor(userRepository: Repository<User>);
    register(registerDto: RegisterDto): Promise<User>;
    login(loginDto: LoginDto): Promise<User>;
    authenticateSocial(_socialProfile: SocialAuthProfile): Promise<User>;
}
