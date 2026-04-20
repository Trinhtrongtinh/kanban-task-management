import { AuthProvider } from '../../../database/entities';
import { AuthProviderContract } from './auth-provider.interface';
import { LocalAuthProvider } from './local-auth.provider';
import { GoogleAuthProvider } from './google-auth.provider';
export declare class AuthProviderRegistry {
    private readonly providers;
    constructor(localAuthProvider: LocalAuthProvider, googleAuthProvider: GoogleAuthProvider);
    get(provider: AuthProvider): AuthProviderContract;
}
