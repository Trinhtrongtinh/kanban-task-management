import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigType } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfig } from '../../config';
import { GoogleStrategy, JwtStrategy, LocalStrategy } from './strategies';
import { User } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AuthProviderRegistry,
  AuthUserProvisioningService,
  GoogleAuthProvider,
  LocalAuthProvider,
} from './providers';
import { GoogleAuthGuard } from './guards';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (jwt: ConfigType<typeof jwtConfig>) => ({
        secret: jwt.secret,
        signOptions: {
          expiresIn: jwt.expiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    GoogleAuthGuard,
    LocalAuthProvider,
    GoogleAuthProvider,
    AuthUserProvisioningService,
    AuthProviderRegistry,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
