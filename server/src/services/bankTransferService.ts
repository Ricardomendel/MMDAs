import axios, { AxiosInstance } from 'axios';
import { getBankConfig, BankTransferConfig } from '../config/paymentConfig';
import { logger } from '../utils/logger';

export interface BankTransferRequest {
  amount: number;
  reference: string;
  description: string;
  beneficiaryAccount: string;
  beneficiaryBank: string;
  beneficiaryName: string;
  callbackUrl: string;
}

export interface BankTransferResponse {
  success: boolean;
  transactionId?: string;
  reference: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  message: string;
  bank: string;
  amount: number;
  fee: number;
  totalAmount: number;
  estimatedSettlementTime?: string;
}

export abstract class BaseBankTransferService {
  protected config!: BankTransferConfig;
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

  abstract initiateTransfer(request: BankTransferRequest): Promise<BankTransferResponse>;
  abstract checkTransferStatus(transactionId: string): Promise<BankTransferResponse>;
}

export class GhIPSSBankService extends BaseBankTransferService {
  constructor() {
    super();
    this.config = getBankConfig('ghipss');
    
    // Set up authentication headers
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    this.httpClient.defaults.headers.common['X-Merchant-ID'] = this.config.merchantId;
  }

  async initiateTransfer(request: BankTransferRequest): Promise<BankTransferResponse> {
    try {
      logger.info(`Initiating GhIPSS bank transfer for ${request.beneficiaryAccount}, amount: ${request.amount}`);

      const payload = {
        amount: request.amount,
        reference: request.reference,
        description: request.description,
        beneficiary_account: request.beneficiaryAccount,
        beneficiary_bank: request.beneficiaryBank,
        beneficiary_name: request.beneficiaryName,
        callback_url: request.callbackUrl,
        currency: 'GHS'
      };

      const response = await this.httpClient.post(
        `${this.config.baseUrl}/transfers`,
        payload
      );

      logger.info(`GhIPSS transfer initiated successfully: ${response.data.transaction_id}`);

      return {
        success: true,
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status: 'pending',
        message: 'Bank transfer initiated successfully',
        bank: 'GhIPSS',
        amount: request.amount,
        fee: response.data.fee || 0,
        totalAmount: request.amount + (response.data.fee || 0),
        estimatedSettlementTime: response.data.estimated_settlement_time || '24-48 hours'
      };
    } catch (error: any) {
      logger.error(`GhIPSS transfer initiation failed: ${error.message}`);
      
      return {
        success: false,
        reference: request.reference,
        status: 'failed',
        message: error.response?.data?.message || 'Transfer initiation failed',
        bank: 'GhIPSS',
        amount: request.amount,
        fee: 0,
        totalAmount: request.amount
      };
    }
  }

  async checkTransferStatus(transactionId: string): Promise<BankTransferResponse> {
    try {
      logger.info(`Checking GhIPSS transfer status for transaction: ${transactionId}`);

      const response = await this.httpClient.get(
        `${this.config.baseUrl}/transfers/${transactionId}`
      );

      const status = this.mapGhIPSSStatus(response.data.status);
      
      return {
        success: response.data.status === 'COMPLETED',
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status,
        message: response.data.message || 'Status check completed',
        bank: 'GhIPSS',
        amount: response.data.amount,
        fee: response.data.fee || 0,
        totalAmount: response.data.amount + (response.data.fee || 0),
        estimatedSettlementTime: response.data.estimated_settlement_time
      };
    } catch (error: any) {
      logger.error(`GhIPSS status check failed: ${error.message}`);
      
      return {
        success: false,
        reference: transactionId,
        status: 'failed',
        message: 'Status check failed',
        bank: 'GhIPSS',
        amount: 0,
        fee: 0,
        totalAmount: 0
      };
    }
  }

  private mapGhIPSSStatus(ghipssStatus: string): 'pending' | 'processing' | 'success' | 'failed' {
    switch (ghipssStatus?.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PROCESSING':
        return 'processing';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

export class GCBBankService extends BaseBankTransferService {
  constructor() {
    super();
    this.config = getBankConfig('gcb');
    
    // Set up authentication headers
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    this.httpClient.defaults.headers.common['X-Merchant-ID'] = this.config.merchantId;
  }

  async initiateTransfer(request: BankTransferRequest): Promise<BankTransferResponse> {
    try {
      logger.info(`Initiating GCB bank transfer for ${request.beneficiaryAccount}, amount: ${request.amount}`);

      const payload = {
        amount: request.amount,
        reference: request.reference,
        description: request.description,
        beneficiary_account: request.beneficiaryAccount,
        beneficiary_bank: request.beneficiaryBank,
        beneficiary_name: request.beneficiaryName,
        callback_url: request.callbackUrl,
        currency: 'GHS'
      };

      const response = await this.httpClient.post(
        `${this.config.baseUrl}/transfers`,
        payload
      );

      logger.info(`GCB transfer initiated successfully: ${response.data.transaction_id}`);

      return {
        success: true,
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status: 'pending',
        message: 'Bank transfer initiated successfully',
        bank: 'GCB Bank',
        amount: request.amount,
        fee: response.data.fee || 0,
        totalAmount: request.amount + (response.data.fee || 0),
        estimatedSettlementTime: response.data.estimated_settlement_time || '24-48 hours'
      };
    } catch (error: any) {
      logger.error(`GCB transfer initiation failed: ${error.message}`);
      
      return {
        success: false,
        reference: request.reference,
        status: 'failed',
        message: error.response?.data?.message || 'Transfer initiation failed',
        bank: 'GCB Bank',
        amount: request.amount,
        fee: 0,
        totalAmount: request.amount
      };
    }
  }

  async checkTransferStatus(transactionId: string): Promise<BankTransferResponse> {
    try {
      logger.info(`Checking GCB transfer status for transaction: ${transactionId}`);

      const response = await this.httpClient.get(
        `${this.config.baseUrl}/transfers/${transactionId}`
      );

      const status = this.mapGCBStatus(response.data.status);
      
      return {
        success: response.data.status === 'COMPLETED',
        transactionId: response.data.transaction_id,
        reference: response.data.reference,
        status,
        message: response.data.message || 'Status check completed',
        bank: 'GCB Bank',
        amount: response.data.amount,
        fee: response.data.fee || 0,
        totalAmount: response.data.amount + (response.data.fee || 0),
        estimatedSettlementTime: response.data.estimated_settlement_time
      };
    } catch (error: any) {
      logger.error(`GCB status check failed: ${error.message}`);
      
      return {
        success: false,
        reference: transactionId,
        status: 'failed',
        message: 'Status check failed',
        bank: 'GCB Bank',
        amount: 0,
        fee: 0,
        totalAmount: 0
      };
    }
  }

  private mapGCBStatus(gcbStatus: string): 'pending' | 'processing' | 'success' | 'failed' {
    switch (gcbStatus?.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PROCESSING':
        return 'processing';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

export function getBankService(provider: 'ghipss' | 'gcb'): BaseBankTransferService {
  switch (provider) {
    case 'ghipss':
      return new GhIPSSBankService();
    case 'gcb':
      return new GCBBankService();
    default:
      throw new Error(`Unsupported bank transfer provider: ${provider}`);
  }
}

// Bank codes for Ghanaian banks
export const GHANAIAN_BANKS = {
  '001': 'Bank of Ghana',
  '002': 'GCB Bank',
  '003': 'Agricultural Development Bank',
  '004': 'National Investment Bank',
  '005': 'Standard Chartered Bank Ghana',
  '006': 'Barclays Bank Ghana',
  '007': 'Ecobank Ghana',
  '008': 'Fidelity Bank Ghana',
  '009': 'Zenith Bank Ghana',
  '010': 'Access Bank Ghana',
  '011': 'Stanbic Bank Ghana',
  '012': 'Cal Bank',
  '013': 'Bank of Africa Ghana',
  '014': 'First National Bank Ghana',
  '015': 'Republic Bank Ghana',
  '016': 'HFC Bank',
  '017': 'Prudential Bank',
  '018': 'OmniBank',
  '019': 'UniBank',
  '020': 'UT Bank',
  '021': 'Capital Bank',
  '022': 'Sovereign Bank',
  '023': 'Energy Bank',
  '024': 'Construction Bank',
  '025': 'Premium Bank',
  '026': 'Heritage Bank',
  '027': 'First Atlantic Bank',
  '028': 'Guaranty Trust Bank Ghana',
  '029': 'UBA Ghana',
  '030': 'Bank of Baroda Ghana'
};
