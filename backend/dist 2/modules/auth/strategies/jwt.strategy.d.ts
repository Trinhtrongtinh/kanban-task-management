import { Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities';
import { authConfig, jwtConfig } from '../../../config';
export interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userRepository;
    constructor(auth: ConfigType<typeof authConfig>, jwt: ConfigType<typeof jwtConfig>, userRepository: Repository<User>);
    validate(payload: JwtPayload): Promise<{
        userId: string;
        email: string;
    }>;
}
export {};
