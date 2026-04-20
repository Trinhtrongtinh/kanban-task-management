type SameSite = 'lax' | 'strict' | 'none';
declare const _default: (() => {
    cookies: {
        accessTokenName: string;
        refreshTokenName: string;
        csrfTokenName: string;
        sameSite: SameSite;
        domain: string | undefined;
    };
    redirects: {
        successUrl: string;
        failureUrl: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    cookies: {
        accessTokenName: string;
        refreshTokenName: string;
        csrfTokenName: string;
        sameSite: SameSite;
        domain: string | undefined;
    };
    redirects: {
        successUrl: string;
        failureUrl: string;
    };
}>;
export default _default;
