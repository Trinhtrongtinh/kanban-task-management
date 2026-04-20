import type { ConfigType } from '@nestjs/config';
import { appConfig, mailConfig } from '../../config';
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare class MailerService {
    private readonly mail;
    private readonly app;
    private readonly logger;
    private transporter;
    constructor(mail: ConfigType<typeof mailConfig>, app: ConfigType<typeof appConfig>);
    private initializeTransporter;
    sendMail(options: SendEmailOptions): Promise<boolean>;
    sendDeadlineReminder(to: string, cardTitle: string, deadline: Date, boardName: string, cardLink: string): Promise<boolean>;
    sendMentionNotification(to: string, mentionedUsername: string, actorName: string, cardTitle: string, boardName: string, commentContent: string, commentLink: string): Promise<boolean>;
    private formatDeadline;
    private getTimeRemaining;
    private resolveAppUrl;
    private truncateText;
    sendInviteEmail(to: string, workspaceName: string, inviterName: string, role: string, inviteLink: string): Promise<boolean>;
    sendUpgradeSuccessEmail(to: string, username: string, expiredAt: Date): Promise<boolean>;
}
