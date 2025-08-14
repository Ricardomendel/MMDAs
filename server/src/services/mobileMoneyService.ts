import axios, { AxiosInstance } from 'axios';
import { getMobileMoneyConfig, MobileMoneyConfig } from '../config/paymentConfig';
import { logger } from '../utils/logger';

export interface MobileMoneyRequest {
  phone: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface MobileMoneyResponse {
  success: boolean;
  transactionId?: string;
  reference: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  message: string;
  provider: string;
  amount: number;
  fee: number;
  totalAmount: number;
}

export abstract class BaseMobileMoneyService {
  protected config!: MobileMoneyConfig;
  protected httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  abstract initiatePayment(request: MobileMoneyRequest): Promise<MobileMoneyResponse>;
  abstract checkPaymentStatus(transactionId: string): Promise<MobileMoneyResponse>;
}

export class MTNMobileMoneyService extends BaseMobileMoneyService {
  constructor() {
    super();
    this.config = getMobileMoneyConfig('mtn');
    
    // Set up authentication headers
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    this.httpClient.defaults.headers.common['X-Merchant-ID'] = this.config.merchantId;
  }

  async initiatePayment(request: MobileMoneyRequest): Promise<MobileMoneyResponse> {
    try {
      logger.info(`Initiating MTN Mobile Money payment for ${request.phone}, amount: ${request.amount}`);

      const payload = {
        phone: request.phone,
        amount: request.amount,
        reference: request.reference,
        description: request.description,
        callback_url: request.callbackUrl,
        currency: 'GHS'
      };

      const response = await this.httpClient.post(
        `${this.config.baseUrl}/collections`,
        payload
      );

      logger.info(`MTN payment initiated successfully: ${response.data.transaction_id}`);

      return {
        success: true,
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status: 'pending',
        message: 'Payment initiated successfully',
        provider: 'MTN Mobile Money',
        amount: request.amount,
        fee: response.data.fee || 0,
        totalAmount: request.amount + (response.data.fee || 0)
      };
    } catch (error: any) {
      logger.error(`MTN payment initiation failed: ${error.message}`);
      
      return {
        success: false,
        reference: request.reference,
        status: 'failed',
        message: error.response?.data?.message || 'Payment initiation failed',
        provider: 'MTN Mobile Money',
        amount: request.amount,
        fee: 0,
        totalAmount: request.amount
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<MobileMoneyResponse> {
    try {
      logger.info(`Checking MTN payment status for transaction: ${transactionId}`);

      const response = await this.httpClient.get(
        `${this.config.baseUrl}/collections/${transactionId}`
      );

      const status = this.mapMTNStatus(response.data.status);
      
      return {
        success: response.data.status === 'SUCCESSFUL',
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status,
        message: response.data.message || 'Status check completed',
        provider: 'MTN Mobile Money',
        amount: response.data.amount,
        fee: response.data.fee || 0,
        totalAmount: response.data.amount + (response.data.fee || 0)
      };
    } catch (error: any) {
      logger.error(`MTN status check failed: ${error.message}`);
      
      return {
        success: false,
        reference: transactionId,
        status: 'failed',
        message: 'Status check failed',
        provider: 'MTN Mobile Money',
        amount: 0,
        fee: 0,
        totalAmount: 0
      };
    }
  }

  private mapMTNStatus(mtnStatus: string): 'pending' | 'processing' | 'success' | 'failed' {
    switch (mtnStatus?.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PROCESSING':
        return 'processing';
      case 'SUCCESSFUL':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

export class VodafoneCashService extends BaseMobileMoneyService {
  constructor() {
    super();
    this.config = getMobileMoneyConfig('vodafone');
    
    // Set up authentication headers
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    this.httpClient.defaults.headers.common['X-Merchant-ID'] = this.config.merchantId;
  }

  async initiatePayment(request: MobileMoneyRequest): Promise<MobileMoneyResponse> {
    try {
      logger.info(`Initiating Vodafone Cash payment for ${request.phone}, amount: ${request.amount}`);

      const payload = {
        msisdn: request.phone,
        amount: request.amount,
        reference: request.reference,
        description: request.description,
        callback_url: request.callbackUrl,
        currency: 'GHS'
      };

      const response = await this.httpClient.post(
        `${this.config.baseUrl}/payments`,
        payload
      );

      logger.info(`Vodafone payment initiated successfully: ${response.data.transaction_id}`);

      return {
        success: true,
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status: 'pending',
        message: 'Payment initiated successfully',
        provider: 'Vodafone Cash',
        amount: request.amount,
        fee: response.data.fee || 0,
        totalAmount: request.amount + (response.data.fee || 0)
      };
    } catch (error: any) {
      logger.error(`Vodafone payment initiation failed: ${error.message}`);
      
      return {
        success: false,
        reference: request.reference,
        status: 'failed',
        message: error.response?.data?.message || 'Payment initiation failed',
        provider: 'Vodafone Cash',
        amount: request.amount,
        fee: 0,
        totalAmount: request.amount
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<MobileMoneyResponse> {
    try {
      logger.info(`Checking Vodafone payment status for transaction: ${transactionId}`);

      const response = await this.httpClient.get(
        `${this.config.baseUrl}/payments/${transactionId}`
      );

      const status = this.mapVodafoneStatus(response.data.status);
      
      return {
        success: response.data.status === 'SUCCESS',
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status,
        message: response.data.message || 'Status check completed',
        provider: 'Vodafone Cash',
        amount: response.data.amount,
        fee: response.data.fee || 0,
        totalAmount: response.data.amount + (response.data.fee || 0)
      };
    } catch (error: any) {
      logger.error(`Vodafone status check failed: ${error.message}`);
      
      return {
        success: false,
        reference: transactionId,
        status: 'failed',
        message: 'Status check failed',
        provider: 'Vodafone Cash',
        amount: 0,
        fee: 0,
        totalAmount: 0
      };
    }
  }

  private mapVodafoneStatus(vodafoneStatus: string): 'pending' | 'processing' | 'success' | 'failed' {
    switch (vodafoneStatus?.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PROCESSING':
        return 'processing';
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

export class AirtelTigoMoneyService extends BaseMobileMoneyService {
  constructor() {
    super();
    this.config = getMobileMoneyConfig('airtelTigo');
    
    // Set up authentication headers
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    this.httpClient.defaults.headers.common['X-Merchant-ID'] = this.config.merchantId;
  }

  async initiatePayment(request: MobileMoneyRequest): Promise<MobileMoneyResponse> {
    try {
      logger.info(`Initiating AirtelTigo Money payment for ${request.phone}, amount: ${request.amount}`);

      const payload = {
        phone: request.phone,
        amount: request.amount,
        reference: request.reference,
        description: request.description,
        callback_url: request.callbackUrl,
        currency: 'GHS'
      };

      const response = await this.httpClient.post(
        `${this.config.baseUrl}/payments`,
        payload
      );

      logger.info(`AirtelTigo payment initiated successfully: ${response.data.transaction_id}`);

      return {
        success: true,
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status: 'pending',
        message: 'Payment initiated successfully',
        provider: 'AirtelTigo Money',
        amount: request.amount,
        fee: response.data.fee || 0,
        totalAmount: request.amount + (response.data.fee || 0)
      };
    } catch (error: any) {
      logger.error(`AirtelTigo payment initiation failed: ${error.message}`);
      
      return {
        success: false,
        reference: request.reference,
        status: 'failed',
        message: error.response?.data?.message || 'Payment initiation failed',
        provider: 'AirtelTigo Money',
        amount: request.amount,
        fee: 0,
        totalAmount: request.amount
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<MobileMoneyResponse> {
    try {
      logger.info(`Checking AirtelTigo payment status for transaction: ${transactionId}`);

      const response = await this.httpClient.get(
        `${this.config.baseUrl}/payments/${transactionId}`
      );

      const status = this.mapAirtelTigoStatus(response.data.status);
      
      return {
        success: response.data.status === 'SUCCESSFUL',
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status,
        message: response.data.message || 'Status check completed',
        provider: 'AirtelTigo Money',
        amount: response.data.amount,
        fee: response.data.fee || 0,
        totalAmount: response.data.amount + (response.data.fee || 0)
      };
    } catch (error: any) {
      logger.error(`AirtelTigo status check failed: ${error.message}`);
      
      return {
        success: false,
        reference: transactionId,
        status: 'failed',
        message: 'Status check failed',
        provider: 'AirtelTigo Money',
        amount: 0,
        fee: 0,
        totalAmount: 0
      };
    }
  }

  private mapAirtelTigoStatus(airtelTigoStatus: string): 'pending' | 'processing' | 'success' | 'failed' {
    switch (airtelTigoStatus?.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PROCESSING':
        return 'processing';
      case 'SUCCESSFUL':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

export function getMobileMoneyService(provider: 'mtn' | 'vodafone' | 'airtelTigo'): BaseMobileMoneyService {
  switch (provider) {
    case 'mtn':
      return new MTNMobileMoneyService();
    case 'vodafone':
      return new VodafoneCashService();
    case 'airtelTigo':
      return new AirtelTigoMoneyService();
    default:
      throw new Error(`Unsupported mobile money provider: ${provider}`);
  }
}
