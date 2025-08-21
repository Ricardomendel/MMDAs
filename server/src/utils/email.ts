import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates
const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to MMDA Revenue System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to MMDA Revenue System</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello {{name}},</h2>
          <p>Welcome to the MMDA Revenue Mobilization System. Your account has been created successfully.</p>
          <p>To activate your account, please click the verification link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">{{verificationUrl}}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the MMDA Revenue System. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
      Welcome to MMDA Revenue System

      Hello {{name}},

      Welcome to the MMDA Revenue Mobilization System. Your account has been created successfully.

      To activate your account, please visit this link:
      {{verificationUrl}}

      This link will expire in 24 hours.

      If you didn't create this account, please ignore this email.

      Best regards,
      MMDA Revenue System Team
    `
  },
  password_reset: {
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>Password Reset Request</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello {{name}},</h2>
          <p>We received a request to reset your password for your MMDA Revenue System account.</p>
          <p>To reset your password, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">{{resetUrl}}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the MMDA Revenue System. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
      Password Reset Request

      Hello {{name}},

      We received a request to reset your password for your MMDA Revenue System account.

      To reset your password, please visit this link:
      {{resetUrl}}

      This link will expire in 1 hour.

      If you didn't request a password reset, please ignore this email and your password will remain unchanged.

      Best regards,
      MMDA Revenue System Team
    `
  },
  assessment_notification: {
    subject: 'New Tax Assessment Available',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
          <h1>New Tax Assessment</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello {{name}},</h2>
          <p>A new tax assessment has been created for your property/business.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Assessment Details:</h3>
            <p><strong>Assessment Number:</strong> {{assessmentNumber}}</p>
            <p><strong>Type:</strong> {{assessmentType}}</p>
            <p><strong>Amount:</strong> GHS {{amount}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
          </div>
          <p>Please log in to your account to view the full details and make payment.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Assessment
            </a>
          </div>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the MMDA Revenue System. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
      New Tax Assessment

      Hello {{name}},

      A new tax assessment has been created for your property/business.

      Assessment Details:
      - Assessment Number: {{assessmentNumber}}
      - Type: {{assessmentType}}
      - Amount: GHS {{amount}}
      - Due Date: {{dueDate}}

      Please log in to your account to view the full details and make payment.

      Best regards,
      MMDA Revenue System Team
    `
  },
  payment_confirmation: {
    subject: 'Payment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
          <h1>Payment Confirmation</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello {{name}},</h2>
          <p>Thank you for your payment. Your transaction has been processed successfully.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <p><strong>Payment Reference:</strong> {{paymentReference}}</p>
            <p><strong>Assessment Number:</strong> {{assessmentNumber}}</p>
            <p><strong>Amount Paid:</strong> GHS {{amount}}</p>
            <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
            <p><strong>Date:</strong> {{paymentDate}}</p>
          </div>
          <p>A receipt has been generated and is available in your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{receiptUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Download Receipt
            </a>
          </div>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the MMDA Revenue System. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
      Payment Confirmation

      Hello {{name}},

      Thank you for your payment. Your transaction has been processed successfully.

      Payment Details:
      - Payment Reference: {{paymentReference}}
      - Assessment Number: {{assessmentNumber}}
      - Amount Paid: GHS {{amount}}
      - Payment Method: {{paymentMethod}}
      - Date: {{paymentDate}}

      A receipt has been generated and is available in your account.

      Best regards,
      MMDA Revenue System Team
    `
  }
};

// Create transporter
const createTransporter = () => {
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  
  if (isDevelopment) {
    // Use Ethereal for development
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env['ETHEREAL_USER'] || 'test@ethereal.email',
        pass: process.env['ETHEREAL_PASS'] || 'test'
      }
    });
  } else {
    // Check if production SMTP credentials are available
    const smtpHost = process.env['SMTP_HOST'];
    const smtpUser = process.env['SMTP_USER'];
    const smtpPass = process.env['SMTP_PASS'];
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.warn('Production SMTP credentials not configured, email sending will be skipped');
      return null;
    }
    
    // Use production SMTP settings
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }
};

// Replace template variables
const replaceTemplateVariables = (template: string, data: Record<string, any>): string => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    // If no transporter available (credentials not configured), skip sending
    if (!transporter) {
      logger.info('Email sending skipped - no SMTP credentials configured', {
        to: options.to,
        template: options.template
      });
      return;
    }
    
    const template = emailTemplates[options.template];
    
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    const html = replaceTemplateVariables(template.html, options.data);
    const text = replaceTemplateVariables(template.text, options.data);

    const mailOptions = {
      from: process.env['EMAIL_FROM'] || 'noreply@mmda-revenue.com',
      to: options.to,
      subject: options.subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
      template: options.template
    });

    if (process.env['NODE_ENV'] === 'development') {
      logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    logger.error('Email sending failed:', error);
    // Don't throw error - just log it and continue
    // This prevents registration from failing due to email issues
  }
};

// Send bulk emails
export const sendBulkEmail = async (emails: EmailOptions[]): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    // If no transporter available (credentials not configured), skip sending
    if (!transporter) {
      logger.info('Bulk email sending skipped - no SMTP credentials configured');
      return;
    }
    
    for (const email of emails) {
      const template = emailTemplates[email.template];
      
      if (!template) {
        logger.error(`Email template '${email.template}' not found`);
        continue;
      }

      const html = replaceTemplateVariables(template.html, email.data);
      const text = replaceTemplateVariables(template.text, email.data);

      const mailOptions = {
        from: process.env['EMAIL_FROM'] || 'noreply@mmda-revenue.com',
        to: email.to,
        subject: email.subject,
        html,
        text
      };

      await transporter.sendMail(mailOptions);
      
      logger.info('Bulk email sent successfully', {
        to: email.to,
        template: email.template
      });
    }
  } catch (error) {
    logger.error('Bulk email sending failed:', error);
    throw error;
  }
};

// Verify email configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // If no transporter available (credentials not configured), skip verification
    if (!transporter) {
      logger.info('Email config verification skipped - no SMTP credentials configured');
      return false;
    }
    
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error);
    return false;
  }
};
