import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(options: { to: string; subject: string; text: string }) {
    await this.mailerService.sendMail({
      ...options,
      html: options.text,
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Please verify your email',
      html: `
        <h3>Welcome to our service!</h3>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="${verificationLink}">Verify Email</a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}
