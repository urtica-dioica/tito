import nodemailer from 'nodemailer';
import { config } from '../../config/environment';
import logger from '../../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error: (error as Error).message,
        to: options.to,
        subject: options.subject
      });
      return false;
    }
  }

  /**
   * Send password setup email to department head
   */
  async sendDepartmentHeadPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    setupToken: string
  ): Promise<boolean> {
    const setupUrl = `${config.frontend.url}/setup-password?token=${setupToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Department Head Account Setup</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #040404; 
            color: #ffffff; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 0; 
            margin: 20px 0;
            font-weight: 500;
            font-size: 0.875rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          .button:hover {
            background-color: #1a1a1a;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TITO HR Management System</h1>
          </div>
          <div class="content">
            <h2>Welcome to TITO HR, ${firstName} ${lastName}!</h2>
            <p>Your department head account has been created successfully. To complete your account setup, please set up your password by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${setupUrl}" style="display: inline-block; background-color: #040404; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 0; margin: 20px 0; font-weight: 500; font-size: 0.875rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Set Up Password</a>
            </p>
            <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
            <p>If you have any questions or need assistance, please contact the HR department.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from TITO HR Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to TITO HR, ${firstName} ${lastName}!
      
      Your department head account has been created successfully. To complete your account setup, please set up your password by visiting the following link:
      
      ${setupUrl}
      
      Important: This link will expire in 24 hours for security reasons.
      
      If you have any questions or need assistance, please contact the HR department.
      
      This is an automated message from TITO HR Management System. Please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Department Head Account Setup - TITO HR',
      html,
      text
    });
  }

  /**
   * Send password setup email to employee
   */
  async sendEmployeePasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    employeeId: string,
    setupToken: string
  ): Promise<boolean> {
    const setupUrl = `${config.frontend.url}/setup-password?token=${setupToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Employee Account Setup</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #040404; 
            color: #ffffff; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 0; 
            margin: 20px 0;
            font-weight: 500;
            font-size: 0.875rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          .button:hover {
            background-color: #1a1a1a;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TITO HR Management System</h1>
          </div>
          <div class="content">
            <h2>Welcome to TITO HR, ${firstName} ${lastName}!</h2>
            <p>Your employee account has been created successfully.</p>
            <p><strong>Employee ID:</strong> ${employeeId}</p>
            <p>To complete your account setup, please set up your password by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${setupUrl}" style="display: inline-block; background-color: #040404; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 0; margin: 20px 0; font-weight: 500; font-size: 0.875rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Set Up Password</a>
            </p>
            <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
            <p>If you have any questions or need assistance, please contact the HR department.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from TITO HR Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to TITO HR, ${firstName} ${lastName}!
      
      Your employee account has been created successfully.
      Employee ID: ${employeeId}
      
      To complete your account setup, please set up your password by visiting the following link:
      
      ${setupUrl}
      
      Important: This link will expire in 24 hours for security reasons.
      
      If you have any questions or need assistance, please contact the HR department.
      
      This is an automated message from TITO HR Management System. Please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Employee Account Setup - TITO HR',
      html,
      text
    });
  }
}

export const emailService = new EmailService();