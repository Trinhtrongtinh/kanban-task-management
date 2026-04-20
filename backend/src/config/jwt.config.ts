import { registerAs } from '@nestjs/config';
import { StringValue } from 'ms';

interface JwtSettings {
  secret: string;
  expiresIn: StringValue;
  refreshSecret: string;
  refreshExpiresIn: StringValue;
}

export default registerAs(
  'jwt',
  (): JwtSettings => ({
    secret: process.env.JWT_SECRET ?? 'default_secret_key',
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as StringValue,
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ??
      process.env.JWT_SECRET ??
      'default_secret_key',
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
      '7d') as StringValue,
  }),
);
