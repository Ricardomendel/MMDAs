export interface MobileMoneyConfig {
  apiKey: string;
  secretKey: string;
  merchantId: string;
  environment: 'development' | 'production';
  baseUrl: string;
}

export interface BankTransferConfig {
  apiKey: string;
  secretKey: string;
  merchantId: string;
  environment: 'development' | 'production';
  baseUrl: string;
}

export interface CardPaymentConfig {
  provider: string;
  apiKey: string;
  secretKey: string;
  environment: 'development' | 'production';
}

export interface GeneralConfig {
  environment: 'development' | 'production';
  webhookUrl: string;
  callbackUrl: string;
}

export interface PaymentServiceConfig {
  mtn: MobileMoneyConfig;
  vodafone: MobileMoneyConfig;
  airtelTigo: MobileMoneyConfig;
  ghipss: BankTransferConfig;
  gcb: BankTransferConfig;
  cardPayment: CardPaymentConfig;
  general: GeneralConfig;
}

export const paymentConfig: PaymentServiceConfig = {
  mtn: {
    apiKey: process.env['MTN_API_KEY'] || 'sandbox_mtn_key',
    secretKey: process.env['MTN_SECRET_KEY'] || 'sandbox_mtn_secret',
    merchantId: process.env['MTN_MERCHANT_ID'] || 'sandbox_mtn_merchant',
    environment: (process.env['NODE_ENV'] as 'development' | 'production') || 'development',
    baseUrl: process.env['MTN_BASE_URL'] || 'https://sandbox.mtn.com/v1'
  },
  vodafone: {
    apiKey: process.env['VODAFONE_API_KEY'] || 'sandbox_vodafone_key',
    secretKey: process.env['VODAFONE_SECRET_KEY'] || 'sandbox_vodafone_secret',
    merchantId: process.env['VODAFONE_MERCHANT_ID'] || 'sandbox_vodafone_merchant',
    environment: (process.env['NODE_ENV'] as 'development' | 'production') || 'development',
    baseUrl: process.env['VODAFONE_BASE_URL'] || 'https://sandbox.vodafone.com/v1'
  },
  airtelTigo: {
    apiKey: process.env['AIRTELTIGO_API_KEY'] || 'sandbox_airteltigo_key',
    secretKey: process.env['AIRTELTIGO_SECRET_KEY'] || 'sandbox_airteltigo_secret',
    merchantId: process.env['AIRTELTIGO_MERCHANT_ID'] || 'sandbox_airteltigo_merchant',
    environment: (process.env['NODE_ENV'] as 'development' | 'production') || 'development',
    baseUrl: process.env['AIRTELTIGO_BASE_URL'] || 'https://sandbox.airteltigo.com/v1'
  },
  ghipss: {
    apiKey: process.env['GHIPSS_API_KEY'] || 'sandbox_ghipss_key',
    secretKey: process.env['GHIPSS_SECRET_KEY'] || 'sandbox_ghipss_secret',
    merchantId: process.env['GHIPSS_MERCHANT_ID'] || 'sandbox_ghipss_merchant',
    environment: (process.env['NODE_ENV'] as 'development' | 'production') || 'development',
    baseUrl: process.env['GHIPSS_BASE_URL'] || 'https://sandbox.ghipss.com/v1'
  },
  gcb: {
    apiKey: process.env['GCB_API_KEY'] || 'sandbox_gcb_key',
    secretKey: process.env['GCB_SECRET_KEY'] || 'sandbox_gcb_secret',
    merchantId: process.env['GCB_MERCHANT_ID'] || 'sandbox_gcb_merchant',
    environment: (process.env['NODE_ENV'] as 'development' | 'production') || 'development',
    baseUrl: process.env['GCB_BASE_URL'] || 'https://sandbox.gcb.com/v1'
  },
  cardPayment: {
    provider: process.env['CARD_PAYMENT_PROVIDER'] || 'paystack',
    apiKey: process.env['CARD_PAYMENT_API_KEY'] || 'sandbox_card_key',
    secretKey: process.env['CARD_PAYMENT_SECRET_KEY'] || 'sandbox_card_secret',
    environment: (process.env['NODE_ENV'] as 'development' | 'production') || 'development'
  },
  general: {
    environment: (process.env['NODE_ENV'] as 'development' | 'production') || 'development',
    webhookUrl: process.env['PAYMENT_WEBHOOK_URL'] || 'http://localhost:5000/api/payments/webhook',
    callbackUrl: process.env['PAYMENT_CALLBACK_URL'] || 'http://localhost:3000/payment/callback'
  }
};

// Helper function to get mobile money config
export function getMobileMoneyConfig(provider: 'mtn' | 'vodafone' | 'airtelTigo'): MobileMoneyConfig {
  return paymentConfig[provider];
}

// Helper function to get bank transfer config
export function getBankConfig(provider: 'ghipss' | 'gcb'): BankTransferConfig {
  return paymentConfig[provider];
}

// Helper function to check if we're in production mode
export function isProduction(): boolean {
  return paymentConfig.general.environment === 'production';
}

// Helper function to get base URL for a provider
export function getProviderBaseUrl(provider: string, type: 'mobile_money' | 'bank_transfer'): string {
  if (type === 'mobile_money') {
    const config = getMobileMoneyConfig(provider as 'mtn' | 'vodafone' | 'airtelTigo');
    return config.baseUrl;
  } else {
    const config = getBankConfig(provider as 'ghipss' | 'gcb');
    return config.baseUrl;
  }
}

export function getCardPaymentConfig(): CardPaymentConfig {
  return paymentConfig.cardPayment;
}

export function getGeneralConfig(): GeneralConfig {
  return paymentConfig.general;
}
