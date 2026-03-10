import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = this.configService.get<number>('MAIL_PORT', 587);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (!user || !pass) {
      this.logger.warn(
        'Mail credentials not configured. Email sending will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log(`Mail transporter initialized with host: ${host}`);
  }

  /**
   * Send email
   */
  async sendMail(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Mail transporter not initialized. Skipping email send.',
      );
      return false;
    }

    try {
      const fromEmail = this.configService.get<string>(
        'MAIL_FROM',
        'noreply@kanban.app',
      );
      const fromName = this.configService.get<string>(
        'MAIL_FROM_NAME',
        'Kanban App',
      );

      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send deadline reminder email
   */
  async sendDeadlineReminder(
    to: string,
    cardTitle: string,
    deadline: Date,
    boardName: string,
    cardLink: string,
  ): Promise<boolean> {
    const formattedDeadline = this.formatDeadline(deadline);
    const timeRemaining = this.getTimeRemaining(deadline);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
          .card-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .deadline { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin: 15px 0; }
          .deadline-urgent { background: #f8d7da; border: 1px solid #dc3545; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏰ Nhắc nhở hạn chót</h2>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p>Thẻ sau đây sắp đến hạn chót:</p>
            
            <div class="card-title">${cardTitle}</div>
            <p><strong>Board:</strong> ${boardName}</p>
            
            <div class="deadline ${timeRemaining.hours < 6 ? 'deadline-urgent' : ''}">
              <strong>⏱️ Hạn chót:</strong> ${formattedDeadline}<br>
              <strong>⌛ Thời gian còn lại:</strong> ${timeRemaining.text}
            </div>
            
            <a href="${cardLink}" class="btn">Xem thẻ</a>
            
            <p style="margin-top: 20px;">Hãy hoàn thành nhiệm vụ trước khi hết hạn!</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ Kanban App</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Nhắc nhở hạn chót
      
      Thẻ: ${cardTitle}
      Board: ${boardName}
      Hạn chót: ${formattedDeadline}
      Thời gian còn lại: ${timeRemaining.text}
      
      Xem thẻ: ${cardLink}
    `;

    return this.sendMail({
      to,
      subject: `⏰ Nhắc nhở: "${cardTitle}" sắp đến hạn`,
      html,
      text,
    });
  }

  private formatDeadline(deadline: Date): string {
    return deadline.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getTimeRemaining(deadline: Date): { text: string; hours: number } {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return { text: `${hours} giờ ${minutes} phút`, hours };
    }
    return { text: `${minutes} phút`, hours: 0 };
  }

  /**
   * Send workspace invitation email
   */
  async sendInviteEmail(
    to: string,
    workspaceName: string,
    inviterName: string,
    role: string,
    inviteLink: string,
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
          .workspace-name { font-size: 20px; font-weight: bold; color: #667eea; margin: 15px 0; }
          .role-badge { display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
          .btn { display: inline-block; background: #28a745; color: white; padding: 14px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
          .btn:hover { background: #218838; }
          .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
          .note { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin-top: 20px; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📬 Lời mời tham gia Workspace</h2>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã mời bạn tham gia workspace:</p>
            
            <div class="workspace-name">${workspaceName}</div>
            
            <p>Vai trò của bạn: <span class="role-badge">${role}</span></p>
            
            <p style="text-align: center;">
              <a href="${inviteLink}" class="btn">✅ Chấp nhận lời mời</a>
            </p>
            
            <div class="note">
              <strong>Lưu ý:</strong> Đường link này sẽ hết hạn sau 7 ngày. Nếu bạn không yêu cầu lời mời này, vui lòng bỏ qua email.
            </div>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ Kanban App</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Lời mời tham gia Workspace
      
      ${inviterName} đã mời bạn tham gia workspace "${workspaceName}"
      Vai trò: ${role}
      
      Chấp nhận lời mời: ${inviteLink}
      
      Lưu ý: Đường link này sẽ hết hạn sau 7 ngày.
    `;

    return this.sendMail({
      to,
      subject: `📬 Bạn được mời tham gia workspace "${workspaceName}"`,
      html,
      text,
    });
  }

  /**
   * Send upgrade success email
   */
  async sendUpgradeSuccessEmail(
    to: string,
    username: string,
    expiredAt: Date,
  ): Promise<boolean> {
    const formattedDate = expiredAt.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
          .success-icon { font-size: 48px; margin-bottom: 15px; }
          .plan-badge { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 18px; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
          .feature-item:last-child { border-bottom: none; }
          .feature-icon { color: #28a745; margin-right: 10px; }
          .expiry { background: #e3f2fd; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">🎉</div>
            <h2>Nâng cấp thành công!</h2>
          </div>
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Cảm ơn bạn đã nâng cấp lên gói:</p>
            
            <p style="text-align: center; margin: 20px 0;">
              <span class="plan-badge">✨ PRO</span>
            </p>
            
            <div class="features">
              <h3>Các tính năng bạn đã mở khóa:</h3>
              <div class="feature-item"><span class="feature-icon">✅</span> Không giới hạn Workspaces</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Không giới hạn Boards</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Tải lên file không giới hạn dung lượng</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Báo cáo và thống kê nâng cao</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Hỗ trợ ưu tiên 24/7</div>
            </div>
            
            <div class="expiry">
              <strong>📅 Hết hạn:</strong> ${formattedDate}
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ Kanban App</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      🎉 Nâng cấp thành công!
      
      Xin chào ${username},
      
      Cảm ơn bạn đã nâng cấp lên gói PRO!
      
      Hết hạn: ${formattedDate}
      
      Các tính năng bạn đã mở khóa:
      - Không giới hạn Workspaces
      - Không giới hạn Boards
      - Tải lên file không giới hạn dung lượng
      - Báo cáo và thống kê nâng cao
      - Hỗ trợ ưu tiên 24/7
    `;

    return this.sendMail({
      to,
      subject: '🎉 Chúc mừng! Bạn đã nâng cấp lên gói PRO',
      html,
      text,
    });
  }
}
