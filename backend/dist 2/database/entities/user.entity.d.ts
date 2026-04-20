export declare enum PlanType {
    FREE = "FREE",
    PRO = "PRO"
}
export declare enum AuthProvider {
    LOCAL = "LOCAL",
    GOOGLE = "GOOGLE"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    username: string;
    authProvider: AuthProvider;
    avatarUrl: string | null;
    planType: PlanType;
    expiredAt: Date | null;
    stripeCustomerId: string | null;
    isVerified: boolean;
    notifyDueDateEmail: boolean;
    notifyMentionEmail: boolean;
    resetPasswordTokenHash: string | null;
    resetPasswordExpiresAt: Date | null;
    refreshTokenHash: string | null;
    refreshTokenExpiresAt: Date | null;
    createdAt: Date;
}
