import twilio from 'twilio';
import { logger } from './logger';

interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

interface SMSTemplate {
  message: string;
  variables: string[];
}

// SMS templates
const smsTemplates: Record<string, SMSTemplate> = {
  welcome: {
    message: 'Welcome to MMDA Revenue System. Your account has been created successfully. Please verify your email to activate your account.',
    variables: []
  },
  verification: {
    message: 'Your MMDA Revenue System verification code is: {{code}}. Valid for 10 minutes.',
    variables: ['code']
  },
  assessment_notification: {
    message: 'New tax assessment available. Assessment: {{assessmentNumber}}, Amount: GHS {{amount}}, Due: {{dueDate}}. Login to view details.',
    variables: ['assessmentNumber', 'amount', 'dueDate']
  },
  payment_confirmation: {
    message: 'Payment confirmed! Reference: {{paymentReference}}, Amount: GHS {{amount}}. Thank you for your payment.',
    variables: ['paymentReference', 'amount']
  },
  payment_reminder: {
    message: 'Reminder: Your tax payment of GHS {{amount}} is due on {{dueDate}}. Assessment: {{assessmentNumber}}. Please make payment to avoid penalties.',
    variables: ['amount', 'dueDate', 'assessmentNumber']
  },
  overdue_notification: {
    message: 'URGENT: Your tax payment of GHS {{amount}} is overdue. Assessment: {{assessmentNumber}}. Penalties may apply. Please pay immediately.',
    variables: ['amount', 'assessmentNumber']
  }
};

// Initialize Twilio client
const createTwilioClient = () => {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  return twilio(accountSid, authToken);
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

// Send SMS
export const sendSMS = async (options: SMSOptions): Promise<void> => {
  try {
    const isDevelopment = process.env['NODE_ENV'] === 'development';
    
    if (isDevelopment) {
      // Log SMS in development instead of sending
      logger.info('SMS would be sent in production:', {
        to: options.to,
        message: options.message,
        from: options.from || process.env['TWILIO_PHONE_NUMBER']
      });
      return;
    }

    const client = createTwilioClient();
    const fromNumber = options.from || process.env['TWILIO_PHONE_NUMBER'];
    
    if (!fromNumber) {
      throw new Error('Twilio phone number not configured');
    }

    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: options.to
    });

    logger.info('SMS sent successfully', {
      messageId: message.sid,
      to: options.to,
      status: message.status
    });
  } catch (error) {
    logger.error('SMS sending failed:', error);
    throw error;
  }
};

// Send SMS using template
export const sendSMSTemplate = async (
  to: string,
  templateName: string,
  data: Record<string, any> = {}
): Promise<void> => {
  try {
    const template = smsTemplates[templateName];
    
    if (!template) {
      throw new Error(`SMS template '${templateName}' not found`);
    }

    // Check if all required variables are provided
    for (const variable of template.variables) {
      if (!data[variable]) {
        throw new Error(`Missing required variable '${variable}' for SMS template '${templateName}'`);
      }
    }

    const message = replaceTemplateVariables(template.message, data);
    
    await sendSMS({
      to,
      message
    });
  } catch (error) {
    logger.error('SMS template sending failed:', error);
    throw error;
  }
};

// Send bulk SMS
export const sendBulkSMS = async (smsList: SMSOptions[]): Promise<void> => {
  try {
    for (const sms of smsList) {
      await sendSMS(sms);
      
      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    logger.info('Bulk SMS sent successfully', {
      count: smsList.length
    });
  } catch (error) {
    logger.error('Bulk SMS sending failed:', error);
    throw error;
  }
};

// Send bulk SMS using template
export const sendBulkSMSTemplate = async (
  recipients: Array<{ phone: string; data: Record<string, any> }>,
  templateName: string
): Promise<void> => {
  try {
    const template = smsTemplates[templateName];
    
    if (!template) {
      throw new Error(`SMS template '${templateName}' not found`);
    }

    for (const recipient of recipients) {
      // Check if all required variables are provided
      for (const variable of template.variables) {
        if (!recipient.data[variable]) {
          logger.warn(`Missing required variable '${variable}' for recipient ${recipient.phone}`);
          continue;
        }
      }

      const message = replaceTemplateVariables(template.message, recipient.data);
      
      await sendSMS({
        to: recipient.phone,
        message
      });
      
      // Add delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    logger.info('Bulk SMS template sent successfully', {
      count: recipients.length,
      template: templateName
    });
  } catch (error) {
    logger.error('Bulk SMS template sending failed:', error);
    throw error;
  }
};

// Verify phone number
export const verifyPhoneNumber = async (phoneNumber: string): Promise<boolean> => {
  try {
    const isDevelopment = process.env['NODE_ENV'] === 'development';
    
    if (isDevelopment) {
      // In development, just validate the format
      const phoneRegex = /^\+233[0-9]{9}$/;
      return phoneRegex.test(phoneNumber);
    }

    const client = createTwilioClient();
    
    // Use Twilio's Lookup API to verify the phone number
    await client.lookups.v1.phoneNumbers(phoneNumber).fetch();
    
    return true; // Assume valid if lookup succeeds
  } catch (error) {
    logger.error('Phone number verification failed:', error);
    return false;
  }
};

// Get SMS delivery status
export const getSMSStatus = async (messageId: string): Promise<string | null> => {
  try {
    const isDevelopment = process.env['NODE_ENV'] === 'development';
    
    if (isDevelopment) {
      return 'delivered'; // Mock status for development
    }

    const client = createTwilioClient();
    const message = await client.messages(messageId).fetch();
    
    return message.status;
  } catch (error) {
    logger.error('Failed to get SMS status:', error);
    return null;
  }
};

// Verify SMS configuration
export const verifySMSConfig = async (): Promise<boolean> => {
  try {
    const isDevelopment = process.env['NODE_ENV'] === 'development';
    
    if (isDevelopment) {
      logger.info('SMS configuration verified (development mode)');
      return true;
    }

    const client = createTwilioClient();
    
    // Test the connection by fetching account info
    const accountSid = process.env['TWILIO_ACCOUNT_SID'];
    if (!accountSid) {
      throw new Error('Twilio account SID not configured');
    }
    const account = await client.api.accounts(accountSid).fetch();
    
    logger.info('SMS configuration verified successfully', {
      accountSid: account.sid,
      status: account.status
    });
    
    return true;
  } catch (error) {
    logger.error('SMS configuration verification failed:', error);
    return false;
  }
};
