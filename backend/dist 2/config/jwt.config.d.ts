import { StringValue } from 'ms';
interface JwtSettings {
    secret: string;
    expiresIn: StringValue;
    refreshSecret: string;
    refreshExpiresIn: StringValue;
}
declare const _default: (() => JwtSettings) & import("@nestjs/config").ConfigFactoryKeyHost<JwtSettings>;
export default _default;
