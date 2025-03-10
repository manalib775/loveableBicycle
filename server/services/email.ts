import { MailService } from '@sendgrid/mail';
import { randomInt } from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

export function generateOTP(): string {
  return randomInt(1000, 9999).toString().padStart(4, '0');
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send(params);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendVerificationOTP(
  to: string,
  otp: string,
  name: string
): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Pling!</h2>
      <p>Hello ${name},</p>
      <p>Your email verification code is:</p>
      <h1 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 5px;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <p>Best regards,<br>The Pling Team</p>
    </div>
  `;

  return sendEmail({
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@pling.co.in',
    subject: 'Your Pling Verification Code',
    text: `Hello ${name}, Your verification code is: ${otp}. This code will expire in 10 minutes.`,
    html: htmlContent,
  });
}